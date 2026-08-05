from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

# Shared fields across Document schemas
class DocumentBase(BaseModel):
    title: str
    document_type: str
    notes: Optional[str] = None

# Schema used when validating metadata during Document upload
class DocumentCreate(BaseModel):
    case_id: int
    document_type: str
    notes: Optional[str] = None

# Nested User info in DocumentResponse
class DocumentUserResponse(BaseModel):
    id: int
    full_name: Optional[str] = None
    email: str

    class Config:
        from_attributes = True

# Nested Case info in DocumentResponse
class DocumentCaseResponse(BaseModel):
    id: int
    case_number: str
    title: str

    class Config:
        from_attributes = True

# Schema returned for individual Document API responses
class DocumentResponse(BaseModel):
    id: int
    case_id: int
    title: str
    document_type: str
    file_name: str
    file_path: str
    file_size: int
    mime_type: Optional[str] = None
    notes: Optional[str] = None
    uploaded_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    case: Optional[DocumentCaseResponse] = None
    uploaded_by: Optional[DocumentUserResponse] = None

    class Config:
        from_attributes = True

# Schema returned for paginated document lists
class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int
    page: int
    limit: int

    class Config:
        from_attributes = True
