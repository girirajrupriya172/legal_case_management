from fastapi import APIRouter, Depends, Query, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies import get_db, get_current_user
from app.schemas.case import CaseCreate, CaseUpdate, CaseResponse, CaseDetailResponse
from app.schemas.common import PaginatedResponse
from app.crud.case import (
    get_cases,
    get_case_by_id,
    get_case_detail,
    create_case,
    update_case,
    delete_case
)
from app.crud.client import get_client_by_id
from app.models.user import User
from app.services.notification_service import notify_case_created, notify_case_status_changed

router = APIRouter()

@router.get(
    "",
    response_model=PaginatedResponse[CaseResponse],
    summary="List cases with filtering and search",
    description="Retrieve a paginated list of legal cases with search query matching and filtering by status and priority.",
    responses={
        200: {"description": "Paginated list of cases returned successfully."},
        401: {"description": "Authentication token missing or invalid."},
    },
)
@router.get("/", response_model=PaginatedResponse[CaseResponse], include_in_schema=False)
def read_cases(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1, description="Page number to retrieve"),
    limit: int = Query(10, ge=1, le=100, description="Number of items per page"),
    search: Optional[str] = Query(None, description="Search term matching case number, title, court details, or client name"),
    status: Optional[str] = Query(None, description="Filter cases by status"),
    priority: Optional[str] = Query(None, description="Filter cases by priority")
):
    """
    Retrieve a paginated list of cases.
    Supports searching and filtering by status and priority.
    Requires a valid JWT token.
    """
    cases, total, total_pages = get_cases(
        db=db,
        page=page,
        limit=limit,
        search=search,
        status=status,
        priority=priority,
        owner_id=current_user.id
    )


    return PaginatedResponse(
        items=cases,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages
    )

@router.post(
    "",
    response_model=CaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new legal case",
    description="Open a new legal case in the system, generate a unique case number, and trigger background notification.",
    responses={
        201: {"description": "Case opened successfully."},
        401: {"description": "Authentication token missing or invalid."},
        404: {"description": "Specified Client does not exist."},
    },
)
@router.post("/", response_model=CaseResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def add_case(
    case_in: CaseCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Open/Register a new case in the system.
    Generates a unique Case Number and binds it to the specified client.
    Requires a valid JWT token.
    """
    # 1. Verify that the referenced Client exists in the system
    client = get_client_by_id(db, client_id=case_in.client_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cannot create case: The specified Client does not exist."
        )

    # 2. Invoke CRUD layer to create case and generate unique file number
    new_case = create_case(db=db, case_in=case_in)

    # 3. Trigger background notification
    notify_case_created(
        background_tasks=background_tasks,
        case_id=new_case.id,
        case_number=new_case.case_number,
        case_title=new_case.title,
        user_id=current_user.id
    )

    return new_case

@router.get(
    "/{case_id}",
    response_model=CaseResponse,
    summary="Get case basic record",
    description="Retrieve basic details of a single case record by primary key ID.",
    responses={
        200: {"description": "Case record returned successfully."},
        401: {"description": "Authentication token missing or invalid."},
        404: {"description": "Case record not found."},
    },
)
def read_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch a single Case file by primary key ID.
    Requires a valid JWT token.
    """
    db_case = get_case_by_id(db, case_id=case_id)
    if not db_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case record not found."
        )
    return db_case

@router.get(
    "/{case_id}/detail",
    response_model=CaseDetailResponse,
    summary="Get detailed case overview",
    description="Retrieve comprehensive case details including client info, hearings, tasks, documents, and unified activity timeline.",
    responses={
        200: {"description": "Case detailed overview returned successfully."},
        401: {"description": "Authentication token missing or invalid."},
        404: {"description": "Case record not found."},
    },
)
def read_case_detail(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch comprehensive Case details including nested client information,
    hearings schedule, tasks history, and a unified activity timeline.
    Used by the Case Details page on the frontend.
    Requires a valid JWT token.
    """
    # Call the CRUD function that loads all relationships and builds timeline
    case_detail = get_case_detail(db, case_id=case_id)
    if not case_detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case record not found."
        )
    return case_detail

@router.put(
    "/{case_id}",
    response_model=CaseResponse,
    summary="Update an existing case",
    description="Update legal case details, court info, status, or priority. Triggers status change notifications.",
    responses={
        200: {"description": "Case updated successfully."},
        401: {"description": "Authentication token missing or invalid."},
        404: {"description": "Case or Client record not found."},
    },
)
def modify_case(
    case_id: int,
    case_in: CaseUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Modify details of an existing Case record.
    Requires a valid JWT token.
    """
    # 1. Verify case exists
    db_case = get_case_by_id(db, case_id=case_id)
    if not db_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case record not found."
        )

    # 2. Track old status for notification comparison
    old_status = db_case.status

    # 3. If client_id is being changed, verify the new client exists
    if case_in.client_id is not None and case_in.client_id != db_case.client_id:
        client = get_client_by_id(db, client_id=case_in.client_id)
        if not client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cannot update case: The new Client does not exist."
            )

    # 4. Perform the update
    updated_case = update_case(db=db, db_case=db_case, case_in=case_in)

    # 5. Trigger notification if status changed
    if case_in.status is not None and case_in.status != old_status:
        notify_case_status_changed(
            background_tasks=background_tasks,
            case_id=updated_case.id,
            case_number=updated_case.case_number,
            new_status=updated_case.status,
            user_id=current_user.id
        )

    return updated_case

@router.delete(
    "/{case_id}",
    response_model=CaseResponse,
    summary="Delete a case record",
    description="Delete a legal case file and purge associated hearings, tasks, and document metadata.",
    responses={
        200: {"description": "Case deleted successfully."},
        401: {"description": "Authentication token missing or invalid."},
        404: {"description": "Case record not found."},
    },
)
def remove_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a Case and purge all associated hearings and tasks.
    Requires a valid JWT token.
    """
    # 1. Verify case exists
    db_case = get_case_by_id(db, case_id=case_id)
    if not db_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case record not found."
        )

    # 2. Perform deletion
    return delete_case(db=db, db_case=db_case)
