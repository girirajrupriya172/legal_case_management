from datetime import datetime, date, time
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.client import Client
from app.models.case import Case
from app.models.hearing import Hearing
from app.models.task import Task

def get_dashboard_data(db: Session, user_id: int):
    """
    Query the database to aggregate statistics, upcoming hearings, and recent activities
    for the main dashboard for a specific user (owner).
    """
    # 1. Gather aggregate statistics counts scoped to current user
    total_clients = db.query(Client).filter(Client.owner_id == user_id).count()
    
    active_cases = db.query(Case).join(Client).filter(
        Client.owner_id == user_id,
        Case.status.in_(["Ongoing", "Pending"])
    ).count()
    
    # Define today's time range boundary to filter schedule
    today_start = datetime.combine(date.today(), time.min)
    today_end = datetime.combine(date.today(), time.max)
    
    todays_hearings_count = db.query(Hearing).join(Client).filter(
        Client.owner_id == user_id,
        Hearing.hearing_date.between(today_start, today_end)
    ).count()
    
    upcoming_hearings_count = db.query(Hearing).join(Client).filter(
        Client.owner_id == user_id,
        Hearing.hearing_date > today_end
    ).count()
    
    pending_tasks_count = db.query(Task).outerjoin(Case).outerjoin(Client).filter(
        or_(Task.user_id == user_id, Client.owner_id == user_id),
        Task.status == "Pending"
    ).count()
    
    # 2. Query hearings scheduled starting today (ordered chronologically)
    hearings_query = db.query(Hearing).join(Case).join(Client).filter(
        Client.owner_id == user_id,
        Hearing.hearing_date >= today_start
    ).order_by(Hearing.hearing_date.asc()).all()
    
    upcoming_hearings = []
    for h in hearings_query:
        upcoming_hearings.append({
            "id": h.id,
            "hearing_date": h.hearing_date,
            "court_room": h.court_room,
            "status": h.status,
            "case_title": h.case.title if h.case else "N/A",
            "case_number": h.case.case_number if h.case else "N/A",
            "client_name": h.client.full_name if h.client else "N/A"
        })

    # 3. Query recent activities/tasks
    recent_tasks = db.query(Task).outerjoin(Case).outerjoin(Client).filter(
        or_(Task.user_id == user_id, Client.owner_id == user_id)
    ).order_by(Task.created_at.desc()).limit(10).all()
    
    recent_activities = []
    for t in recent_tasks:
        recent_activities.append({
            "id": t.id,
            "title": t.title,
            "description": t.description if t.description else "",
            "status": t.status,
            "created_at": t.created_at
        })

    # Combine all parts to match DashboardResponse schema
    return {
        "stats": {
            "total_clients": total_clients,
            "active_cases": active_cases,
            "todays_hearings_count": todays_hearings_count,
            "upcoming_hearings_count": upcoming_hearings_count,
            "pending_tasks_count": pending_tasks_count
        },
        "upcoming_hearings": upcoming_hearings,
        "recent_activities": recent_activities
    }

