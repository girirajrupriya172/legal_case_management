from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

# ─────────────────────────────────────────────────────────────────────────────
# Base Hearing Schema - Shared attributes across Hearing endpoints
# ─────────────────────────────────────────────────────────────────────────────
class HearingBase(BaseModel):
    hearing_date: datetime = Field(..., description="Date and time of the court hearing")
    court_room: str = Field(..., description="Court name or courtroom number")
    judge_name: Optional[str] = Field(None, description="Name of the presiding judge")
    hearing_type: Optional[str] = Field("Trial", description="Type of hearing, e.g. Trial, Arguments, Initial Hearing")
    notes: Optional[str] = Field(None, description="Pre-hearing or ongoing hearing notes")
    outcome: Optional[str] = Field(None, description="Final outcome or ruling summary of the hearing")
    status: Optional[str] = Field("Scheduled", description="Status: Scheduled, Ongoing, Pending, Completed, Adjourned, Cancelled")

# ─────────────────────────────────────────────────────────────────────────────
# Schema for creating a new Hearing (POST /api/v1/hearings)
# ─────────────────────────────────────────────────────────────────────────────
class HearingCreate(HearingBase):
    case_id: int = Field(..., description="ID of the legal case this hearing belongs to")
    client_id: Optional[int] = Field(None, description="Optional Client ID. If omitted, pulled automatically from Case")

# ─────────────────────────────────────────────────────────────────────────────
# Schema for updating an existing Hearing (PUT /api/v1/hearings/{id})
# ─────────────────────────────────────────────────────────────────────────────
class HearingUpdate(BaseModel):
    hearing_date: Optional[datetime] = None
    court_room: Optional[str] = None
    judge_name: Optional[str] = None
    hearing_type: Optional[str] = None
    notes: Optional[str] = None
    outcome: Optional[str] = None
    status: Optional[str] = None
    case_id: Optional[int] = None
    client_id: Optional[int] = None

# ─────────────────────────────────────────────────────────────────────────────
# Nested response objects inside Hearing API responses
# ─────────────────────────────────────────────────────────────────────────────
class HearingCaseResponse(BaseModel):
    id: int
    case_number: str
    title: str

    class Config:
        from_attributes = True

class HearingClientResponse(BaseModel):
    id: int
    full_name: str
    email: str

    class Config:
        from_attributes = True

# ─────────────────────────────────────────────────────────────────────────────
# Main Hearing Response model returned by backend APIs
# ─────────────────────────────────────────────────────────────────────────────
class HearingResponse(HearingBase):
    id: int
    case_id: int
    client_id: int
    created_at: datetime
    updated_at: datetime
    case: Optional[HearingCaseResponse] = None
    client: Optional[HearingClientResponse] = None

    class Config:
        from_attributes = True

# ─────────────────────────────────────────────────────────────────────────────
# Container schema for list & paginated responses
# ─────────────────────────────────────────────────────────────────────────────
class HearingListResponse(BaseModel):
    hearings: List[HearingResponse]
    total: int
    upcoming_count: int = 0
    completed_count: int = 0

    class Config:
        from_attributes = True
