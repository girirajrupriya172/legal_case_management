from fastapi import APIRouter, Depends, Query, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.hearing import (
    HearingListResponse,
    HearingResponse,
    HearingCreate,
    HearingUpdate
)
from app.crud.hearing import (
    get_hearings,
    get_hearing_by_id,
    get_hearings_by_case,
    get_upcoming_hearings,
    create_hearing,
    update_hearing,
    delete_hearing
)
from app.crud.case import get_case_by_id
from app.services.notification_service import notify_hearing_scheduled

router = APIRouter()


@router.get(
    "",
    response_model=HearingListResponse,
    summary="List hearings with filtering and search",
    description="Retrieve a paginated list of court hearings with search and filtering by case, client, or upcoming status.",
    responses={
        200: {"description": "Paginated hearings list returned successfully."},
        401: {"description": "Authentication token missing or invalid."},
    },
)
@router.get("/", response_model=HearingListResponse, include_in_schema=False)
def read_hearings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1, description="Page number to retrieve"),
    limit: int = Query(20, ge=1, le=100, description="Number of items per page"),
    case_id: Optional[int] = Query(None, description="Filter hearings by Case ID"),
    client_id: Optional[int] = Query(None, description="Filter hearings by Client ID"),
    status: Optional[str] = Query(None, description="Filter hearings by status"),
    search: Optional[str] = Query(None, description="Search courtroom, judge, case, or client name"),
    upcoming_only: bool = Query(False, description="Set True to return only future hearings")
):
    """
    Retrieve a paginated list of hearings.
    Supports search across judge, court, case, client, and filters by case_id, status, or upcoming date.
    Requires JWT authentication.
    """
    skip = (page - 1) * limit
    hearings, total, upcoming_count, completed_count = get_hearings(
        db=db,
        skip=skip,
        limit=limit,
        case_id=case_id,
        client_id=client_id,
        status=status,
        search=search,
        upcoming_only=upcoming_only
    )

    return {
        "hearings": hearings,
        "total": total,
        "upcoming_count": upcoming_count,
        "completed_count": completed_count
    }

@router.get(
    "/upcoming",
    response_model=List[HearingResponse],
    summary="List upcoming hearings",
    description="Fetch upcoming court hearings ordered chronologically by date.",
    responses={
        200: {"description": "Upcoming hearings list returned successfully."},
        401: {"description": "Authentication token missing or invalid."},
    },
)
def read_upcoming_hearings(
    limit: int = Query(10, ge=1, le=50, description="Limit for upcoming hearings"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch upcoming hearings ordered chronologically (nearest date first).
    Requires JWT authentication.
    """
    return get_upcoming_hearings(db=db, limit=limit)

@router.get(
    "/case/{case_id}",
    response_model=List[HearingResponse],
    summary="Get hearings for a specific case",
    description="Retrieve all court hearings scheduled for a specific Legal Case.",
    responses={
        200: {"description": "List of case hearings returned successfully."},
        401: {"description": "Authentication token missing or invalid."},
        404: {"description": "Legal Case not found."},
    },
)
def read_case_hearings(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve all court hearings scheduled for a specific Legal Case.
    Requires JWT authentication.
    """
    db_case = get_case_by_id(db, case_id=case_id)
    if not db_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Legal Case with ID {case_id} not found."
        )

    return get_hearings_by_case(db=db, case_id=case_id)

@router.get(
    "/{hearing_id}",
    response_model=HearingResponse,
    summary="Get single hearing record",
    description="Fetch details of a single court hearing by primary key ID.",
    responses={
        200: {"description": "Hearing record returned successfully."},
        401: {"description": "Authentication token missing or invalid."},
        404: {"description": "Hearing record not found."},
    },
)
def read_hearing(
    hearing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch details of a single court hearing by primary key ID.
    Requires JWT authentication.
    """
    db_hearing = get_hearing_by_id(db, hearing_id=hearing_id)
    if not db_hearing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hearing record #{hearing_id} not found."
        )

    return db_hearing

@router.post(
    "",
    response_model=HearingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Schedule a new court hearing",
    description="Schedule a court hearing for a legal case and trigger background notification.",
    responses={
        201: {"description": "Hearing scheduled successfully."},
        400: {"description": "Validation error in hearing parameters."},
        401: {"description": "Authentication token missing or invalid."},
        404: {"description": "Target Legal Case does not exist."},
    },
)
@router.post("/", response_model=HearingResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def schedule_hearing(
    hearing_in: HearingCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Schedule a new court hearing for a legal case.
    Validates case existence and automatically assigns client_id if missing.
    Requires JWT authentication.
    """
    db_case = get_case_by_id(db, case_id=hearing_in.case_id)
    if not db_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cannot schedule hearing: Case #{hearing_in.case_id} does not exist."
        )

    try:
        new_hearing = create_hearing(db=db, hearing_in=hearing_in)
        date_str = new_hearing.hearing_date.strftime("%b %d, %Y %I:%M %p") if new_hearing.hearing_date else "TBD"
        notify_hearing_scheduled(
            background_tasks=background_tasks,
            hearing_id=new_hearing.id,
            case_id=new_hearing.case_id,
            court_room=new_hearing.court_room,
            hearing_date_str=date_str,
            user_id=current_user.id
        )
        return new_hearing
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err)
        )


@router.put(
    "/{hearing_id}",
    response_model=HearingResponse,
    summary="Update an existing hearing",
    description="Update hearing schedule details, courtroom, judge, status, or outcome notes.",
    responses={
        200: {"description": "Hearing updated successfully."},
        401: {"description": "Authentication token missing or invalid."},
        404: {"description": "Hearing or target Legal Case not found."},
    },
)
def modify_hearing(
    hearing_id: int,
    hearing_in: HearingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update details, status, outcome, or notes of an existing hearing.
    Requires JWT authentication.
    """
    db_hearing = get_hearing_by_id(db, hearing_id=hearing_id)
    if not db_hearing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hearing record #{hearing_id} not found."
        )

    if hearing_in.case_id is not None and hearing_in.case_id != db_hearing.case_id:
        new_case = get_case_by_id(db, case_id=hearing_in.case_id)
        if not new_case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cannot update hearing: Target Case #{hearing_in.case_id} does not exist."
            )

    return update_hearing(db=db, db_hearing=db_hearing, hearing_in=hearing_in)

@router.delete(
    "/{hearing_id}",
    response_model=HearingResponse,
    summary="Delete a court hearing",
    description="Delete a scheduled court hearing record from the database.",
    responses={
        200: {"description": "Hearing deleted successfully."},
        401: {"description": "Authentication token missing or invalid."},
        404: {"description": "Hearing record not found."},
    },
)
def remove_hearing(
    hearing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a scheduled hearing record from the database.
    Requires JWT authentication.
    """
    db_hearing = get_hearing_by_id(db, hearing_id=hearing_id)
    if not db_hearing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hearing record #{hearing_id} not found."
        )

    return delete_hearing(db=db, db_hearing=db_hearing)
