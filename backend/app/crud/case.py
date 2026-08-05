from sqlalchemy.orm import Session
from sqlalchemy import or_
import datetime
from app.models.case import Case
from app.models.client import Client
from app.models.task import Task
from app.schemas.case import CaseCreate, CaseUpdate
from app.crud.common import calculate_pagination

def get_case_by_id(db: Session, case_id: int):
    """
    Retrieve a single case record by primary key ID.
    """
    return db.query(Case).filter(Case.id == case_id).first()

def get_cases(
    db: Session,
    page: int = 1,
    limit: int = 10,
    search: str = None,
    status: str = None,
    priority: str = None
):
    """
    Retrieve case records with server-side page pagination, searching, and filtering.
    Joins the Client table to support searching by client name.
    """
    # 1. Base query joining Case with Client to load related data
    query = db.query(Case).outerjoin(Client)

    # 2. Search filter: matches case number, title, court details, or client full name
    if search:
        search_filter = or_(
            Case.case_number.ilike(f"%{search}%"),
            Case.title.ilike(f"%{search}%"),
            Case.court_details.ilike(f"%{search}%"),
            Client.full_name.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)

    # 3. Status filter (e.g. 'Ongoing', 'Pending')
    if status:
        query = query.filter(Case.status == status)

    # 4. Priority filter (e.g. 'High', 'Medium', 'Low')
    if priority:
        query = query.filter(Case.priority == priority)

    # 5. Count total matches before pagination
    total = query.count()

    # 6. Page offset calculation & total pages computation via common helper
    skip, total_pages = calculate_pagination(page, limit, total)

    # 7. Apply ordering (newest first), offset, and limits
    cases = (
        query.order_by(Case.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return cases, total, total_pages

def create_case(db: Session, case_in: CaseCreate):
    """
    Create a new Case record. Generates a case number based on the current year.
    Example: '2026-0001', '2026-0002', etc.
    """
    # Generate unique case number: YYYY-NNNN
    current_year = datetime.datetime.now().year
    year_prefix = str(current_year)

    # Query the database for the highest case number starting with the current year
    last_case = (
        db.query(Case)
        .filter(Case.case_number.like(f"{year_prefix}-%"))
        .order_by(Case.case_number.desc())
        .first()
    )

    if last_case:
        try:
            # Extract sequence number after the hyphen and increment
            last_sequence = int(last_case.case_number.split("-")[1])
            new_sequence = last_sequence + 1
        except (IndexError, ValueError):
            new_sequence = 1
    else:
        new_sequence = 1

    # Format sequence as 4 digits (e.g. '0001', '0002')
    case_number = f"{year_prefix}-{new_sequence:04d}"

    # Build the database model
    db_case = Case(
        case_number=case_number,
        title=case_in.title,
        description=case_in.description,
        status=case_in.status or "Pending",
        court_details=case_in.court_details,
        priority=case_in.priority or "Medium",
        client_id=case_in.client_id
    )

    # Add transaction to MySQL database
    db.add(db_case)
    db.commit()
    db.refresh(db_case)
    return db_case

def update_case(db: Session, db_case: Case, case_in: CaseUpdate):
    """
    Update details of an existing case record.
    Only updates fields that were explicitly provided in the request payload.
    """
    update_data = case_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_case, field, value)

    db.add(db_case)
    db.commit()
    db.refresh(db_case)
    return db_case

def delete_case(db: Session, db_case: Case):
    """
    Remove a case from the database.
    Will cascade delete related hearings and tasks.
    """
    db.delete(db_case)
    db.commit()
    return db_case


def get_case_detail(db: Session, case_id: int):
    """
    Retrieve a single case by ID along with its full nested data:
    - Client details (name, email, phone, address)
    - Hearings list (dates, court rooms, statuses)
    - Tasks list (titles, descriptions, statuses)
    - Unified timeline (hearings + tasks sorted chronologically)

    This powers the Case Details page on the frontend.
    Similar pattern to get_client_profile() in crud/client.py.
    """
    # 1. Fetch the case record from MySQL
    #    SQLAlchemy will lazy-load the 'client', 'hearings', and 'tasks'
    #    relationships when we access them below (defined in models/case.py)
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        return None

    # 2. Build the unified timeline by combining hearings and tasks
    #    Each event gets a unique string ID (e.g. "hearing_3") to avoid
    #    integer ID collisions between the two different tables
    timeline = []

    # 2a. Add hearing events to the timeline
    #     case.hearings is populated by SQLAlchemy's relationship() defined
    #     in models/case.py: hearings = relationship("Hearing", back_populates="case")
    for hearing in case.hearings:
        timeline.append({
            "id": f"hearing_{hearing.id}",
            "event_type": "hearing",
            "title": f"Hearing — {hearing.court_room}",
            "description": f"Court hearing scheduled at {hearing.court_room}. Status: {hearing.status}.",
            "status": hearing.status,
            "event_date": hearing.hearing_date
        })

    # 2b. Add task events to the timeline
    #     case.tasks is populated by SQLAlchemy's relationship() defined
    #     in models/case.py: tasks = relationship("Task", back_populates="case")
    for task in case.tasks:
        timeline.append({
            "id": f"task_{task.id}",
            "event_type": "task",
            "title": task.title,
            "description": task.description or "",
            "status": task.status,
            "event_date": task.created_at
        })

    # 2c. Add the case creation event itself to the timeline
    timeline.append({
        "id": f"case_{case.id}",
        "event_type": "case_created",
        "title": "Case Filed",
        "description": f"Case #{case.case_number} — \"{case.title}\" was registered in the system.",
        "status": case.status,
        "event_date": case.created_at
    })

    # 3. Sort timeline by event_date descending (newest first)
    timeline.sort(key=lambda x: x["event_date"], reverse=True)

    # 4. Build and return the nested response dictionary
    #    Pydantic's CaseDetailResponse schema (from schemas/case.py) will
    #    validate and serialize this structure into clean JSON
    return {
        "id": case.id,
        "case_number": case.case_number,
        "title": case.title,
        "description": case.description,
        "status": case.status,
        "court_details": case.court_details,
        "priority": case.priority,
        "client_id": case.client_id,
        "created_at": case.created_at,
        "updated_at": case.updated_at,
        "client": case.client,        # SQLAlchemy relationship → Client ORM object
        "hearings": case.hearings,     # SQLAlchemy relationship → list of Hearing ORM objects
        "tasks": case.tasks,           # SQLAlchemy relationship → list of Task ORM objects
        "timeline": timeline           # Our computed list of dicts
    }

