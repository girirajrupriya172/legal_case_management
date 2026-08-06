from datetime import datetime, date, time, timedelta
from sqlalchemy.orm import Session
from app.models.client import Client
from app.models.case import Case
from app.models.hearing import Hearing
from app.models.task import Task
from app.models.user import User

def seed_database(db: Session) -> None:
    """
    Checks if the database is already initialized.
    No dummy/mock clients are seeded to ensure strict multi-user data isolation.
    """
    # 1. Fetch or create a default Attorney User if no users exist
    attorney = db.query(User).filter(User.role == "attorney").first()
    if not attorney:
        from app.core.security import get_password_hash
        attorney = User(
            email="a.sterling@lexvault.legal",
            hashed_password=get_password_hash("Sterling2026!"),
            full_name="Alexander Sterling",
            role="attorney",
            is_active=True
        )
        db.add(attorney)
        db.commit()
        db.refresh(attorney)

    print("Database seeding check complete. No dummy clients created.")


