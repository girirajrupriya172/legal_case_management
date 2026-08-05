from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

# Shared fields across Case schemas
class CaseBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "Pending"
    court_details: Optional[str] = None
    priority: Optional[str] = "Medium"

# Schema received on Case creation
class CaseCreate(CaseBase):
    client_id: int

# Schema received on Case modification
class CaseUpdate(CaseBase):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    court_details: Optional[str] = None
    priority: Optional[str] = None
    client_id: Optional[int] = None

# Nested Client details inside CaseResponse
class CaseClientResponse(BaseModel):
    id: int
    full_name: str
    email: str

    class Config:
        from_attributes = True

# Schema returned in API responses
class CaseResponse(CaseBase):
    id: int
    case_number: str
    client_id: int
    created_at: datetime
    updated_at: datetime
    client: Optional[CaseClientResponse] = None

    class Config:
        from_attributes = True

# Schema for paginated list response
class CaseListResponse(BaseModel):
    cases: List[CaseResponse]
    total: int
    page: int
    limit: int

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────────────────────
# Case Details (Nested) Response Schemas — Used by GET /cases/{case_id}/detail
# ─────────────────────────────────────────────────────────────────────────────

# Extended Client details for Case Detail page (includes phone + address)
class CaseDetailClientResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Hearing record nested inside Case Detail response
class HearingDetailResponse(BaseModel):
    id: int
    hearing_date: datetime
    court_room: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Task/History record nested inside Case Detail response
class TaskDetailResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: str
    due_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Unified timeline event (combines hearings + tasks chronologically)
class TimelineEventResponse(BaseModel):
    id: str
    event_type: str
    title: str
    description: str
    status: str
    event_date: datetime

    class Config:
        from_attributes = True

# Master nested response for Case Detail page
class CaseDetailResponse(CaseBase):
    id: int
    case_number: str
    client_id: int
    created_at: datetime
    updated_at: datetime
    client: Optional[CaseDetailClientResponse] = None
    hearings: List[HearingDetailResponse] = []
    tasks: List[TaskDetailResponse] = []
    timeline: List[TimelineEventResponse] = []

    class Config:
        from_attributes = True
