from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, Tuple, List
from app.models.document import Document
from app.models.case import Case
from app.models.user import User
from app.crud.common import calculate_pagination

def create_document(
    db: Session,
    case_id: int,
    title: str,
    document_type: str,
    file_name: str,
    file_path: str,
    file_size: int,
    mime_type: Optional[str] = None,
    notes: Optional[str] = None,
    user_id: Optional[int] = None
) -> Document:
    """
    Create a new Document database record linking file metadata to a case and uploading user.
    """
    db_document = Document(
        case_id=case_id,
        title=title,
        document_type=document_type,
        file_name=file_name,
        file_path=file_path,
        file_size=file_size,
        mime_type=mime_type,
        notes=notes,
        uploaded_by_id=user_id
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document


def get_document_by_id(db: Session, document_id: int) -> Optional[Document]:
    """
    Retrieve a single document by its primary key ID.
    """
    return db.query(Document).filter(Document.id == document_id).first()


def get_documents_by_case(
    db: Session,
    case_id: int,
    skip: int = 0,
    limit: int = 100,
    document_type: Optional[str] = None
) -> Tuple[List[Document], int]:
    """
    Retrieve all documents associated with a specific legal case.
    """
    query = db.query(Document).filter(Document.case_id == case_id)
    
    if document_type:
        query = query.filter(Document.document_type == document_type)
        
    total = query.count()
    documents = (
        query.order_by(Document.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return documents, total


def get_all_documents(
    db: Session,
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    document_type: Optional[str] = None,
    case_id: Optional[int] = None
) -> Tuple[List[Document], int, int]:
    """
    Retrieve documents across all cases with server-side page pagination, searching, and filtering.
    """
    query = db.query(Document).outerjoin(Case).outerjoin(User)

    if case_id:
        query = query.filter(Document.case_id == case_id)

    if document_type:
        query = query.filter(Document.document_type == document_type)

    if search:
        search_filter = or_(
            Document.title.ilike(f"%{search}%"),
            Document.file_name.ilike(f"%{search}%"),
            Document.document_type.ilike(f"%{search}%"),
            Document.notes.ilike(f"%{search}%"),
            Case.title.ilike(f"%{search}%"),
            Case.case_number.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)

    total = query.count()
    skip, total_pages = calculate_pagination(page, limit, total)

    documents = (
        query.order_by(Document.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return documents, total, total_pages


def delete_document(db: Session, document_id: int) -> Optional[Document]:
    """
    Delete a document record from the database.
    """
    db_document = get_document_by_id(db, document_id)
    if db_document:
        db.delete(db_document)
        db.commit()
    return db_document
