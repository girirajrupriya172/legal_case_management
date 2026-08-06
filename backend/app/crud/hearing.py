from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func
from datetime import datetime
from typing import Optional, Tuple, List

from app.models.hearing import Hearing
from app.models.case import Case
from app.models.client import Client
from app.schemas.hearing import HearingCreate, HearingUpdate

def get_hearing_by_id(db: Session, hearing_id: int) -> Optional[Hearing]:
    """
    Retrieve a single hearing record by primary key ID.
    Eagerly loads Case and Client relationships to prevent N+1 queries.
    """
    return (
        db.query(Hearing)
        .options(joinedload(Hearing.case), joinedload(Hearing.client))
        .filter(Hearing.id == hearing_id)
        .first()
    )

def get_hearings(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    case_id: Optional[int] = None,
    client_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    upcoming_only: bool = False,
    owner_id: Optional[int] = None
) -> Tuple[List[Hearing], int, int, int]:
    """
    Retrieve hearings with filtering, pagination, search, and aggregate metrics.
    
    Returns:
        (hearings_list, total_count, upcoming_count, completed_count)
    """
    # 1. Base query joining Hearing with Case and Client with eager loading
    query = (
        db.query(Hearing)
        .options(joinedload(Hearing.case), joinedload(Hearing.client))
        .outerjoin(Case)
        .outerjoin(Client)
    )

    # Filter by owner_id if provided
    if owner_id is not None:
        query = query.filter(Client.owner_id == owner_id)

    # 2. Filter by specific case_id if requested
    if case_id:
        query = query.filter(Hearing.case_id == case_id)


    # 3. Filter by specific client_id if requested
    if client_id:
        query = query.filter(Hearing.client_id == client_id)

    # 4. Filter by status (e.g. 'Scheduled', 'Completed', 'Adjourned', 'Cancelled')
    if status:
        query = query.filter(Hearing.status == status)

    # 5. Search filter across court room, judge name, hearing type, case title, case number, or client name
    if search:
        search_pattern = f"%{search}%"
        search_filter = or_(
            Hearing.court_room.ilike(search_pattern),
            Hearing.judge_name.ilike(search_pattern),
            Hearing.hearing_type.ilike(search_pattern),
            Hearing.notes.ilike(search_pattern),
            Case.title.ilike(search_pattern),
            Case.case_number.ilike(search_pattern),
            Client.full_name.ilike(search_pattern)
        )
        query = query.filter(search_filter)

    # 6. Filter upcoming hearings if requested
    now = datetime.now()
    if upcoming_only:
        query = query.filter(Hearing.hearing_date >= now).filter(Hearing.status != "Cancelled")

    # 7. Calculate aggregate statistics
    total = query.count()
    
    # Calculate global upcoming & completed counts for hearings
    upcoming_count = db.query(Hearing).filter(Hearing.hearing_date >= now, Hearing.status != "Cancelled").count()
    completed_count = db.query(Hearing).filter(Hearing.status == "Completed").count()

    # 8. Order results: if upcoming_only, order by date ASC; else date DESC
    if upcoming_only:
        query = query.order_by(Hearing.hearing_date.asc())
    else:
        query = query.order_by(Hearing.hearing_date.desc())

    hearings = query.offset(skip).limit(limit).all()
    return hearings, total, upcoming_count, completed_count

def get_hearings_by_case(db: Session, case_id: int) -> List[Hearing]:
    """
    Retrieve all hearing records associated with a specific legal case.
    """
    return (
        db.query(Hearing)
        .options(joinedload(Hearing.case), joinedload(Hearing.client))
        .filter(Hearing.case_id == case_id)
        .order_by(Hearing.hearing_date.desc())
        .all()
    )

def get_upcoming_hearings(db: Session, limit: int = 10) -> List[Hearing]:
    """
    Retrieve upcoming hearings ordered by date ascending (closest hearing first).
    """
    now = datetime.now()
    return (
        db.query(Hearing)
        .options(joinedload(Hearing.case), joinedload(Hearing.client))
        .filter(Hearing.hearing_date >= now)
        .filter(Hearing.status != "Cancelled")
        .order_by(Hearing.hearing_date.asc())
        .limit(limit)
        .all()
    )

def create_hearing(db: Session, hearing_in: HearingCreate) -> Hearing:
    """
    Schedule a new hearing for a case.
    If client_id is not explicitly provided in request payload,
    automatically fetch client_id from the parent Case.
    """
    client_id = hearing_in.client_id
    if not client_id:
        parent_case = db.query(Case).filter(Case.id == hearing_in.case_id).first()
        if parent_case:
            client_id = parent_case.client_id
        else:
            raise ValueError(f"Case with ID {hearing_in.case_id} does not exist.")

    db_hearing = Hearing(
        hearing_date=hearing_in.hearing_date,
        court_room=hearing_in.court_room,
        judge_name=hearing_in.judge_name,
        hearing_type=hearing_in.hearing_type or "Trial",
        notes=hearing_in.notes,
        outcome=hearing_in.outcome,
        status=hearing_in.status or "Scheduled",
        case_id=hearing_in.case_id,
        client_id=client_id
    )

    db.add(db_hearing)
    db.commit()
    db.refresh(db_hearing)
    return db_hearing

def update_hearing(db: Session, db_hearing: Hearing, hearing_in: HearingUpdate) -> Hearing:
    """
    Update details of an existing hearing record.
    Supports partial updates via exclude_unset=True.
    """
    update_data = hearing_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_hearing, field, value)

    db.add(db_hearing)
    db.commit()
    db.refresh(db_hearing)
    return db_hearing

def delete_hearing(db: Session, db_hearing: Hearing) -> Hearing:
    """
    Remove a hearing record from the database.
    """
    db.delete(db_hearing)
    db.commit()
    return db_hearing
