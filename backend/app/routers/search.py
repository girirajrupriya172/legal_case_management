from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from pydantic import BaseModel

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.client import Client
from app.models.case import Case
from app.models.document import Document

router = APIRouter()

class SearchResultClient(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None

    class Config:
        from_attributes = True

class SearchResultCase(BaseModel):
    id: int
    case_number: str
    title: str
    status: str
    priority: str

    class Config:
        from_attributes = True

class SearchResultDocument(BaseModel):
    id: int
    title: str
    document_type: str
    file_name: str
    case_id: int

    class Config:
        from_attributes = True

class GlobalSearchResponse(BaseModel):
    clients: List[SearchResultClient]
    cases: List[SearchResultCase]
    documents: List[SearchResultDocument]
    total_results: int

@router.get(
    "",
    response_model=GlobalSearchResponse,
    summary="Global entity search",
    description="Perform global cross-entity search across Clients (name, email, phone), Cases (number, title, court), and Documents (title, filename, notes).",
    responses={
        200: {"description": "Global search matches returned grouped by entity type."},
        401: {"description": "Authentication token missing or invalid."},
    },
)
def global_search(
    q: str = Query(..., min_length=1, description="Search query string"),
    limit: int = Query(5, ge=1, le=20, description="Max results per entity type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Global search across Clients, Cases, and Documents.
    Returns up to 'limit' matching records for each entity category.
    """
    search_pattern = f"%{q}%"

    # 1. Search Clients by name, email, phone, address
    clients = (
        db.query(Client)
        .filter(
            or_(
                Client.full_name.ilike(search_pattern),
                Client.email.ilike(search_pattern),
                Client.phone.ilike(search_pattern),
                Client.address.ilike(search_pattern)
            )
        )
        .limit(limit)
        .all()
    )

    # 2. Search Cases by case number, title, court details
    cases = (
        db.query(Case)
        .filter(
            or_(
                Case.case_number.ilike(search_pattern),
                Case.title.ilike(search_pattern),
                Case.court_details.ilike(search_pattern)
            )
        )
        .limit(limit)
        .all()
    )

    # 3. Search Documents by title, file name, document type, notes
    documents = (
        db.query(Document)
        .filter(
            or_(
                Document.title.ilike(search_pattern),
                Document.file_name.ilike(search_pattern),
                Document.document_type.ilike(search_pattern),
                Document.notes.ilike(search_pattern)
            )
        )
        .limit(limit)
        .all()
    )

    total_results = len(clients) + len(cases) + len(documents)

    return GlobalSearchResponse(
        clients=clients,
        cases=cases,
        documents=documents,
        total_results=total_results
    )
