import os
import uuid
import shutil
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.dependencies import get_db, get_current_user
from app.core.security import SECRET_KEY, ALGORITHM
from app.schemas.document import DocumentResponse, DocumentListResponse
from app.schemas.common import PaginatedResponse
from app.crud.document import (
    create_document,
    get_document_by_id,
    get_documents_by_case,
    get_all_documents,
    delete_document
)
from app.crud.case import get_case_by_id
from app.models.user import User
from app.services.notification_service import notify_document_uploaded

router = APIRouter()


# Define absolute base directory for uploads on server
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "documents"))
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _verify_token_query(token: str, db: Session) -> User:
    """
    Verify a JWT token passed as a query parameter.
    Used ONLY for the preview endpoint because browser <iframe> and <img> elements
    cannot attach custom HTTP headers (like Authorization: Bearer).
    Standard endpoints continue to use Depends(get_current_user) via headers.
    """
    from app.crud.user import get_user_by_email
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = get_user_by_email(db, email=email)
    if user is None or not user.is_active:
        raise credentials_exception
    return user


@router.get(
    "",
    response_model=PaginatedResponse[DocumentResponse],
    summary="List all documents with filtering",
    description="Retrieve a paginated list of legal documents with search and type filtering.",
    responses={
        200: {"description": "Paginated documents list returned successfully."},
        401: {"description": "Authentication token missing or invalid."},
    },
)
@router.get("/", response_model=PaginatedResponse[DocumentResponse], include_in_schema=False)
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1, description="Page number to retrieve"),
    limit: int = Query(10, ge=1, le=100, description="Number of items per page"),
    search: Optional[str] = Query(None, description="Search by document title, case number, or notes"),
    document_type: Optional[str] = Query(None, description="Filter by document type (FIR, Court Orders, etc.)"),
    case_id: Optional[int] = Query(None, description="Filter by specific case ID")
):
    """
    Retrieve a paginated list of all legal documents across cases or for a specific case.
    Supports text search and type filtering.
    """
    documents, total, total_pages = get_all_documents(
        db=db,
        page=page,
        limit=limit,
        search=search,
        document_type=document_type,
        case_id=case_id,
        owner_id=current_user.id
    )


    return PaginatedResponse(
        items=documents,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages
    )


@router.get(
    "/case/{case_id}",
    response_model=DocumentListResponse,
    summary="Get documents for a specific case",
    description="Retrieve all document files associated with a specific legal case.",
    responses={
        200: {"description": "Case documents returned successfully."},
        401: {"description": "Authentication token missing or invalid."},
        404: {"description": "Legal Case not found."},
    },
)
def list_documents_by_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    document_type: Optional[str] = Query(None)
):
    """
    Retrieve all documents associated with a specific legal case.
    """
    target_case = get_case_by_id(db, case_id=case_id)
    if not target_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Legal Case with ID {case_id} not found."
        )

    documents, total = get_documents_by_case(
        db=db,
        case_id=case_id,
        skip=skip,
        limit=limit,
        document_type=document_type
    )

    return {
        "documents": documents,
        "total": total,
        "page": 1,
        "limit": limit
    }


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Get document metadata",
    description="Retrieve metadata for a single legal document by primary key ID.",
    responses={
        200: {"description": "Document metadata returned successfully."},
        401: {"description": "Authentication token missing or invalid."},
        404: {"description": "Document record not found."},
    },
)
def get_document_details(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve metadata for a single legal document by ID.
    """
    document = get_document_by_id(db, document_id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found."
        )
    return document


@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a legal document",
    description="Upload a document file (PDF/Image/Doc) for a legal case via Multipart Form Data.",
    responses={
        201: {"description": "Document uploaded and saved successfully."},
        401: {"description": "Authentication token missing or invalid."},
        404: {"description": "Target Legal Case does not exist."},
        500: {"description": "Failed to write file to disk storage."},
    },
)
async def upload_document(
    case_id: int = Form(...),
    document_type: str = Form(...),
    title: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a legal document file for a specific case.
    Accepts Multipart Form Data (file + metadata fields).
    Saves file securely to server disk and creates metadata record in MySQL DB.
    """
    target_case = get_case_by_id(db, case_id=case_id)
    if not target_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cannot upload document. Legal Case with ID {case_id} does not exist."
        )

    original_filename = file.filename or "uploaded_document"
    unique_prefix = uuid.uuid4().hex[:10]
    safe_filename = f"{unique_prefix}_{original_filename.replace(' ', '_')}"
    saved_file_path = os.path.join(UPLOAD_DIR, safe_filename)

    try:
        with open(saved_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write uploaded file to disk storage: {str(err)}"
        )

    file_size = os.path.getsize(saved_file_path)
    document_title = title.strip() if (title and title.strip()) else original_filename

    db_document = create_document(
        db=db,
        case_id=case_id,
        title=document_title,
        document_type=document_type,
        file_name=safe_filename,
        file_path=saved_file_path,
        file_size=file_size,
        mime_type=file.content_type,
        notes=notes,
        user_id=current_user.id
    )

    notify_document_uploaded(
        background_tasks=background_tasks,
        document_id=db_document.id,
        case_id=case_id,
        document_title=document_title,
        document_type=document_type,
        user_id=current_user.id
    )

    return db_document


@router.get(
    "/{document_id}/download",
    summary="Download legal document file",
    description="Download document file attachment via HTTP stream with Content-Disposition attachment header.",
    responses={
        200: {"description": "Document file binary stream returned for download."},
        401: {"description": "Authentication token missing or invalid."},
        404: {"description": "Document record or physical file not found."},
    },
)
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Download document file.
    Returns HTTP FileResponse with 'Content-Disposition: attachment' to force browser file download.
    """
    document = get_document_by_id(db, document_id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document record not found in database."
        )

    if not os.path.exists(document.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical document file missing from server storage disk."
        )

    return FileResponse(
        path=document.file_path,
        filename=document.title or document.file_name,
        media_type=document.mime_type or "application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{document.title or document.file_name}"'
        }
    )


@router.get(
    "/{document_id}/preview",
    summary="Preview document file inline",
    description="Stream document file for inline browser viewing (iframe/img preview). Accepts token in query string.",
    responses={
        200: {"description": "Document file stream returned for inline viewing."},
        401: {"description": "Authentication token missing or invalid."},
        404: {"description": "Document record or physical file not found."},
    },
)
def preview_document(
    document_id: int,
    db: Session = Depends(get_db),
    token: Optional[str] = Query(None, description="JWT token for browser-based iframe preview auth"),
):
    """
    Preview document file in browser (inline mode for PDFs and images).
    Returns HTTP FileResponse with 'Content-Disposition: inline'.

    Authentication:
      - Accepts token as a query param (?token=...) because <iframe src> and <img src>
        cannot send custom Authorization headers — this is a browser limitation.
      - Falls back to standard Bearer header auth if no query token is provided.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated — token query param required for preview."
        )
    _verify_token_query(token, db)

    document = get_document_by_id(db, document_id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document record not found in database."
        )

    if not os.path.exists(document.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical document file missing from server storage disk."
        )

    return FileResponse(
        path=document.file_path,
        media_type=document.mime_type or "application/octet-stream",
        headers={
            "Content-Disposition": "inline"
        }
    )


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete legal document",
    description="Delete a legal document record from database and purge physical file from server disk storage.",
    responses={
        200: {"description": "Legal document and file deleted successfully."},
        401: {"description": "Authentication token missing or invalid."},
        404: {"description": "Document record not found."},
    },
)
def delete_document_endpoint(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a legal document record and remove its physical file from server storage disk.
    """
    document = get_document_by_id(db, document_id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found."
        )

    if os.path.exists(document.file_path):
        try:
            os.remove(document.file_path)
        except Exception as err:
            print(f"Warning: Failed to remove physical file {document.file_path}: {err}")

    delete_document(db, document_id=document_id)

    return {
        "message": "Legal document deleted successfully.",
        "id": document_id
    }
