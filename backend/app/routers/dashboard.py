from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.schemas.dashboard import DashboardResponse
from app.crud.dashboard import get_dashboard_data
from app.models.user import User

router = APIRouter()

@router.get(
    "/stats",
    response_model=DashboardResponse,
    summary="Get aggregated dashboard statistics",
    description="Retrieve aggregated system metrics (total/active cases, clients, hearings, documents), upcoming calendar schedule, and recent notification logs.",
    responses={
        200: {"description": "Dashboard statistics data returned successfully."},
        401: {"description": "Authentication token missing or invalid."},
    },
)
def read_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve aggregated statistics, upcoming calendar schedule, and recent notification logs
    for the main dashboard. Protected endpoint requiring a valid JWT Authorization token.
    """
    return get_dashboard_data(db)
