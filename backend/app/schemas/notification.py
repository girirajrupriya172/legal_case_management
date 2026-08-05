from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

# Shared fields across Notification schemas
class NotificationBase(BaseModel):
    type: str
    title: str
    message: str
    is_read: Optional[bool] = False
    user_id: Optional[int] = None
    case_id: Optional[int] = None
    hearing_id: Optional[int] = None
    document_id: Optional[int] = None
    task_id: Optional[int] = None

# Schema received on Notification creation
class NotificationCreate(NotificationBase):
    pass

# Schema received on updating Notification read status
class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = True

# Schema returned in API responses for individual Notification
class NotificationResponse(NotificationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Schema returned for recent notifications list with unread badge count
class RecentNotificationsResponse(BaseModel):
    notifications: List[NotificationResponse]
    unread_count: int

    class Config:
        from_attributes = True

# Schema for paginated list response
class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    unread_count: int
    total: int
    page: int
    limit: int

    class Config:
        from_attributes = True
