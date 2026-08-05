from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class HearingResponse(BaseModel):
    """
    Schema representing a court hearing in API responses.
    Flattened to include case and client names for ease of consumption in React.
    """
    id: int
    hearing_date: datetime
    court_room: str
    status: str
    case_title: str
    case_number: str
    client_name: str

    class Config:
        from_attributes = True

class ActivityResponse(BaseModel):
    """
    Schema representing a recent activity or system reminder item.
    """
    id: int
    title: str
    description: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    """
    Schema representing aggregate count statistics.
    """
    total_clients: int
    active_cases: int
    todays_hearings_count: int
    upcoming_hearings_count: int
    pending_tasks_count: int

    class Config:
        from_attributes = True

class DashboardResponse(BaseModel):
    """
    Master schema wrapping stats, upcoming hearings, and recent activities.
    """
    stats: DashboardStats
    upcoming_hearings: List[HearingResponse]
    recent_activities: List[ActivityResponse]

    class Config:
        from_attributes = True
