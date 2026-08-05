from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse, ClientProfileResponse
from app.schemas.common import PaginatedResponse
from app.crud.client import (
    get_clients,
    get_client_by_id,
    get_client_by_email,
    create_client,
    update_client,
    delete_client,
    get_client_profile
)
from app.models.user import User

router = APIRouter()

@router.get(
    "",
    response_model=PaginatedResponse[ClientResponse],
    summary="List clients with pagination and search",
    description="Retrieve a paginated list of clients with support for search and status filtering.",
    responses={
        200: {"description": "Paginated list of clients returned successfully."},
        401: {"description": "Authentication token missing or invalid."},
    },
)
@router.get("/", response_model=PaginatedResponse[ClientResponse], include_in_schema=False)
def read_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1, description="Page number to retrieve"),
    limit: int = Query(10, ge=1, le=100, description="Number of items per page"),
    search: str = Query(None, description="Search term for filtering clients"),
    filter_status: str = Query(None, description="Status filter: active_cases or no_cases")
):
    """
    Retrieve a paginated list of clients.
    Supports search query matching and filtering by active case statuses.
    Requires a valid JWT token in the Authorization header.
    """
    clients, total, total_pages = get_clients(
        db=db,
        page=page,
        limit=limit,
        search=search,
        filter_status=filter_status
    )
    
    return PaginatedResponse(
        items=clients,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages
    )

@router.post(
    "",
    response_model=ClientResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new client record",
    description="Register a new legal client in the system. Validates email uniqueness.",
    responses={
        201: {"description": "Client created successfully."},
        400: {"description": "Client email already exists in system."},
        401: {"description": "Authentication token missing or invalid."},
    },
)
@router.post("/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def add_client(
    client_in: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Register a new client in the system.
    Validates email uniqueness and inputs before saving.
    Requires a valid JWT token.
    """
    # 1. Check if email already exists
    existing_client = get_client_by_email(db, email=client_in.email)
    if existing_client:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A client with this email address already exists in the system."
        )
    
    # 2. Call CRUD utility to save to MySQL
    return create_client(db=db, client_in=client_in)

@router.put(
    "/{client_id}",
    response_model=ClientResponse,
    summary="Update an existing client",
    description="Update client contact details and address. Validates email uniqueness.",
    responses={
        200: {"description": "Client updated successfully."},
        400: {"description": "Email address already taken by another client."},
        401: {"description": "Authentication token missing or invalid."},
        404: {"description": "Client record not found."},
    },
)
def modify_client(
    client_id: int,
    client_in: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update client details (name, email, phone, address).
    Validates client existence and email uniqueness.
    Requires a valid JWT token.
    """
    # 1. Check if client exists
    db_client = get_client_by_id(db, client_id=client_id)
    if not db_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found."
        )
    
    # 2. If email is being changed, check if it's already taken by another client
    if client_in.email and client_in.email != db_client.email:
        existing_client = get_client_by_email(db, email=client_in.email)
        if existing_client:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A client with this email address already exists."
            )
            
    # 3. Commit changes to MySQL
    return update_client(db=db, db_client=db_client, client_in=client_in)

@router.delete(
    "/{client_id}",
    response_model=ClientResponse,
    summary="Delete a client record",
    description="Delete a client and all associated case files from the database.",
    responses={
        200: {"description": "Client deleted successfully."},
        401: {"description": "Authentication token missing or invalid."},
        404: {"description": "Client record not found."},
    },
)
def remove_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a client and all associated case files.
    Requires a valid JWT token.
    """
    # 1. Check if client exists
    db_client = get_client_by_id(db, client_id=client_id)
    if not db_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found."
        )
        
    # 2. Perform deletion
    return delete_client(db=db, db_client=db_client)


@router.get(
    "/{client_id}",
    response_model=ClientProfileResponse,
    summary="Get client detailed profile",
    description="Retrieve a single client profile including all associated cases and activity logs.",
    responses={
        200: {"description": "Client profile details returned successfully."},
        401: {"description": "Authentication token missing or invalid."},
        404: {"description": "Client record not found."},
    },
)
def read_client_profile(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve a single client's detailed profile including cases and activity logs.
    Requires a valid JWT token.
    """
    client_profile = get_client_profile(db, client_id=client_id)
    if not client_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found."
        )
    return client_profile

