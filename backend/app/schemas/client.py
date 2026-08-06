from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

class ClientBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(ClientBase):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class ClientResponse(ClientBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
    case_count: int = 0

    class Config:
        from_attributes = True


class ClientListResponse(BaseModel):
    clients: List[ClientResponse]
    total: int
    page: int
    limit: int

    class Config:
        from_attributes = True


class ClientProfileCaseResponse(BaseModel):
    id: int
    case_number: str
    title: str
    description: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ClientProfileActivityResponse(BaseModel):
    id: str
    title: str
    description: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ClientProfileResponse(BaseModel):
    id: int
    owner_id: int
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    cases: List[ClientProfileCaseResponse] = []
    activities: List[ClientProfileActivityResponse] = []

    class Config:
        from_attributes = True


