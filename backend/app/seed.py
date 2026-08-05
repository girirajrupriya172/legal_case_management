from datetime import datetime, date, time, timedelta
from sqlalchemy.orm import Session
from app.models.client import Client
from app.models.case import Case
from app.models.hearing import Hearing
from app.models.task import Task
from app.models.user import User

def seed_database(db: Session) -> None:
    """
    Checks if the database is already seeded. If empty, populates it
    with realistic legal data matching the Stitch design.
    """
    # Prevent duplicate seeding
    if db.query(Client).count() > 0:
        print("Database already contains data. Skipping seeding.")
        return

    print("Seeding database with realistic mock data...")

    # 1. Fetch or create a default Attorney User to assign tasks to
    attorney = db.query(User).filter(User.role == "attorney").first()
    if not attorney:
        # In case auth setup has no user, create a default Alexander Sterling
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

    # 2. Add Clients (matching Stitch mockup names)
    client_1 = Client(full_name="Global Corp", email="legal@globalcorp.com", phone="555-0101", address="100 Enterprise Way")
    client_2 = Client(full_name="Miller Estate", email="executor@miller.org", phone="555-0102", address="88 Pine Crest Lane")
    client_3 = Client(full_name="TechnoSoft Inc.", email="patents@technosoft.io", phone="555-0103", address="500 Silicon Valley Blvd")
    client_4 = Client(full_name="Jane Doe", email="jane.doe@outlook.com", phone="555-0104", address="12 Elm Street")
    client_5 = Client(full_name="Marcus Thorne", email="marcus.t@thornelaw.com", phone="555-0105", address="90 Broadway")

    db.add_all([client_1, client_2, client_3, client_4, client_5])
    db.commit()
    db.refresh(client_1)
    db.refresh(client_2)
    db.refresh(client_3)
    db.refresh(client_4)
    db.refresh(client_5)

    # 3. Add Cases linked to Clients
    case_1 = Case(case_number="2024-0089", title="Sterling vs. Global Corp", description="Commercial contract dispute", status="Ongoing", client_id=client_1.id)
    case_2 = Case(case_number="2024-0112", title="Miller Estate Dispute", description="Estate asset distributions", status="Pending", client_id=client_2.id)
    case_3 = Case(case_number="2023-0941", title="TechnoSoft Patent Review", description="Mobile UI Patent infringement defense", status="Pending", client_id=client_3.id)
    case_4 = Case(case_number="2024-0155", title="Doe Custody Resolution", description="Family court custody arbitration", status="Pending", client_id=client_4.id)
    case_5 = Case(case_number="2024-0312", title="Thorne Commercial Litigation", description="Shareholder payout dispute", status="Pending", client_id=client_5.id)

    db.add_all([case_1, case_2, case_3, case_4, case_5])
    db.commit()
    db.refresh(case_1)
    db.refresh(case_2)
    db.refresh(case_3)
    db.refresh(case_4)
    db.refresh(case_5)

    # 4. Add Today's Hearings (Dynamically bound to today's date)
    today = date.today()
    
    hearing_1 = Hearing(
        hearing_date=datetime.combine(today, time(9, 0)),
        court_room="Room 402B - Federal Court",
        status="Ongoing",
        case_id=case_1.id,
        client_id=client_1.id
    )
    hearing_2 = Hearing(
        hearing_date=datetime.combine(today, time(11, 30)),
        court_room="Judge Chambers 12",
        status="Pending",
        case_id=case_2.id,
        client_id=client_2.id
    )
    hearing_3 = Hearing(
        hearing_date=datetime.combine(today, time(14, 0)),
        court_room="Virtual Room #04",
        status="Pending",
        case_id=case_3.id,
        client_id=client_3.id
    )
    hearing_4 = Hearing(
        hearing_date=datetime.combine(today, time(16, 45)),
        court_room="Superior Court - 5th Floor",
        status="Pending",
        case_id=case_4.id,
        client_id=client_4.id
    )

    # Add extra upcoming hearing tomorrow to test upcoming counts
    hearing_upcoming = Hearing(
        hearing_date=datetime.combine(today + timedelta(days=1), time(10, 0)),
        court_room="Room 101 - District Court",
        status="Pending",
        case_id=case_5.id,
        client_id=client_5.id
    )

    db.add_all([hearing_1, hearing_2, hearing_3, hearing_4, hearing_upcoming])
    db.commit()

    # 5. Add Tasks (Reminders / Recent Activities in Stitch)
    task_1 = Task(
        title="Hearing Reminder",
        description="Sterling vs Global Corp starts in 45 minutes at Federal Court.",
        status="Pending",
        due_date=datetime.combine(today, time(9, 0)),
        case_id=case_1.id,
        user_id=attorney.id
    )
    task_2 = Task(
        title="Document Signed",
        description="Settlement agreement for Case #2024-0089 has been electronically signed.",
        status="Completed",
        case_id=case_1.id,
        user_id=attorney.id
    )
    task_3 = Task(
        title="New Client Lead",
        description="Marcus Thorne requested a consultation for commercial litigation.",
        status="Pending",
        case_id=case_5.id,
        user_id=attorney.id
    )
    task_4 = Task(
        title="System Update",
        description="The e-filing module will be down for maintenance at 11:00 PM EST.",
        status="Pending",
        user_id=attorney.id
    )

    db.add_all([task_1, task_2, task_3, task_4])
    db.commit()

    # 6. Add Initial Sample Notifications for Notification Management Module
    from app.models.notification import Notification

    notif_1 = Notification(
        type="HEARING_REMINDER",
        title="Upcoming Hearing Reminder",
        message="Hearing 'Sterling vs. Global Corp' (Case #2024-0089) starts today at 9:00 AM in Room 402B.",
        is_read=False,
        case_id=case_1.id,
        hearing_id=hearing_1.id,
        user_id=attorney.id,
        created_at=datetime.now() - timedelta(minutes=15)
    )
    notif_2 = Notification(
        type="DOCUMENT_UPLOADED",
        title="Document Uploaded",
        message="Document 'Settlement_Agreement_V1.pdf' uploaded to Case #2024-0089.",
        is_read=False,
        case_id=case_1.id,
        user_id=attorney.id,
        created_at=datetime.now() - timedelta(hours=2)
    )
    notif_3 = Notification(
        type="CASE_CREATED",
        title="New Case Registered",
        message="Case #2024-0312 'Thorne Commercial Litigation' successfully registered.",
        is_read=True,
        case_id=case_5.id,
        user_id=attorney.id,
        created_at=datetime.now() - timedelta(hours=5)
    )
    notif_4 = Notification(
        type="TASK_ASSIGNED",
        title="New Task Assigned",
        message="Task 'Prepare patent review defense strategy' assigned to Alexander Sterling.",
        is_read=False,
        case_id=case_3.id,
        user_id=attorney.id,
        created_at=datetime.now() - timedelta(days=1)
    )
    notif_5 = Notification(
        type="CASE_STATUS_CHANGED",
        title="Case Status Updated",
        message="Case #2024-0089 status changed to 'Ongoing'.",
        is_read=True,
        case_id=case_1.id,
        user_id=attorney.id,
        created_at=datetime.now() - timedelta(days=2)
    )

    db.add_all([notif_1, notif_2, notif_3, notif_4, notif_5])
    db.commit()

    print("Database seeding completed successfully.")

