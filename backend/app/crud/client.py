from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.models.client import Client
from app.models.case import Case
from app.models.task import Task
from app.schemas.client import ClientCreate, ClientUpdate
from app.crud.common import calculate_pagination

def get_clients(
    db: Session,
    owner_id: int,
    page: int = 1,
    limit: int = 10,
    search: str = None,
    filter_status: str = None
):
    """
    Retrieve clients owned by the specified owner_id with support for search, server-side page pagination, filter by case status, and case count calculations.
    """
    # 1. Base query: Join Client with Case, filter by owner_id, and calculate case count using GROUP BY
    query = db.query(Client, func.count(Case.id).label("case_count")).outerjoin(Case).filter(Client.owner_id == owner_id).group_by(Client.id)

    # 2. Apply search filters if search parameter is provided
    if search:
        search_filter = or_(
            Client.full_name.ilike(f"%{search}%"),
            Client.email.ilike(f"%{search}%"),
            Client.phone.ilike(f"%{search}%"),
            Client.address.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)

    # 3. Apply status-based filtering
    if filter_status == "active_cases":
        # Clients who have at least one active case (status is Ongoing or Pending)
        active_client_ids = db.query(Case.client_id).filter(Case.status.in_(["Ongoing", "Pending"])).distinct()
        query = query.filter(Client.id.in_(active_client_ids))
    elif filter_status == "no_cases":
        # Clients who have no cases at all
        query = query.having(func.count(Case.id) == 0)

    # 4. Count total matching rows using a subquery to handle GROUP BY correctly
    total = db.query(query.subquery()).count()

    # 5. Page offset calculation & total pages computation via common helper
    skip, total_pages = calculate_pagination(page, limit, total)

    # 6. Order, paginate, and execute
    query = query.order_by(Client.created_at.desc())
    results = query.offset(skip).limit(limit).all()

    # 7. Map results (Client model object + case count aggregate) to match ClientResponse schema
    clients_list = []
    for client, case_count in results:
        clients_list.append({
            "id": client.id,
            "owner_id": client.owner_id,
            "full_name": client.full_name,
            "email": client.email,
            "phone": client.phone,
            "address": client.address,
            "created_at": client.created_at,
            "updated_at": client.updated_at,
            "case_count": case_count
        })

    return clients_list, total, total_pages

def get_client_by_id(db: Session, client_id: int):
    """
    Retrieve a single client record by primary key ID.
    """
    return db.query(Client).filter(Client.id == client_id).first()

def get_client_by_email(db: Session, email: str, owner_id: int):
    """
    Retrieve a single client record by their email belonging to a specific owner.
    Useful for duplicate checks during creation.
    """
    return db.query(Client).filter(Client.email == email, Client.owner_id == owner_id).first()

def create_client(db: Session, client_in: ClientCreate, owner_id: int):
    """
    Insert a new client record into the database bound to current_user.id.
    """
    db_client = Client(
        full_name=client_in.full_name,
        email=client_in.email,
        phone=client_in.phone,
        address=client_in.address,
        owner_id=owner_id
    )
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

def update_client(db: Session, db_client: Client, client_in: ClientUpdate):
    """
    Update an existing client's details.
    Only updates fields that were explicitly provided in the request payload.
    """
    update_data = client_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_client, field, value)
    
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

def delete_client(db: Session, db_client: Client):
    """
    Delete a client record from the database.
    Due to cascade settings, this will automatically delete related Cases and Hearings.
    """
    db.delete(db_client)
    db.commit()
    return db_client


def get_client_profile(db: Session, client_id: int, owner_id: int = None):
    """
    Retrieve a single client by ID along with their related cases and combined activities.
    If owner_id is provided, enforces that the client belongs to owner_id.
    """
    # 1. Fetch client
    query = db.query(Client).filter(Client.id == client_id)
    if owner_id is not None:
        query = query.filter(Client.owner_id == owner_id)
    client = query.first()
    if not client:
        return None

    # 2. Extract case IDs to fetch related tasks
    case_ids = [c.id for c in client.cases]

    activities = []
    
    # 3. Add hearings as activities
    for hearing in client.hearings:
        activities.append({
            "id": f"hearing_{hearing.id}",
            "title": f"Hearing Scheduled: Case #{hearing.case.case_number if hearing.case else 'N/A'}",
            "description": f"Court Room: {hearing.court_room}",
            "status": hearing.status,
            "created_at": hearing.hearing_date  # Use event date
        })

    # 4. Add tasks as activities
    if case_ids:
        tasks = db.query(Task).filter(Task.case_id.in_(case_ids)).all()
        for task in tasks:
            activities.append({
                "id": f"task_{task.id}",
                "title": f"Task: {task.title}",
                "description": task.description or "",
                "status": task.status,
                "created_at": task.created_at
            })

    # 5. Sort activities by date descending
    activities.sort(key=lambda x: x["created_at"], reverse=True)

    return {
        "id": client.id,
        "owner_id": client.owner_id,
        "full_name": client.full_name,
        "email": client.email,
        "phone": client.phone,
        "address": client.address,
        "created_at": client.created_at,
        "updated_at": client.updated_at,
        "cases": client.cases,
        "activities": activities
    }


