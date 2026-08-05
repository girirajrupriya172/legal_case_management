from typing import Optional
from fastapi import BackgroundTasks
from app.database import SessionLocal
from app.crud.notification import create_notification
from app.schemas.notification import NotificationCreate

def create_notification_in_background(notification_in: NotificationCreate):
    """
    Background worker function executed asynchronously by FastAPI BackgroundTasks.
    Opens a dedicated database session, persists the notification, and ensures session closure.
    """
    db = SessionLocal()
    try:
        create_notification(db=db, notification_in=notification_in)
    except Exception as e:
        print(f"[NOTIFICATION ERROR] Failed to create background notification: {e}")
        db.rollback()
    finally:
        db.close()

def notify_case_created(
    background_tasks: BackgroundTasks,
    case_id: int,
    case_number: str,
    case_title: str,
    user_id: Optional[int] = None
):
    """
    Queue background notification when a new Legal Case is created.
    """
    payload = NotificationCreate(
        type="CASE_CREATED",
        title=f"New Case Created ({case_number})",
        message=f"Case '{case_title}' has been successfully created and registered in Lexora.",
        user_id=user_id,
        case_id=case_id
    )
    background_tasks.add_task(create_notification_in_background, payload)

def notify_case_status_changed(
    background_tasks: BackgroundTasks,
    case_id: int,
    case_number: str,
    new_status: str,
    user_id: Optional[int] = None
):
    """
    Queue background notification when a Case status is updated.
    """
    payload = NotificationCreate(
        type="CASE_STATUS_CHANGED",
        title=f"Case Status Updated ({case_number})",
        message=f"Case #{case_number} status has been updated to '{new_status}'.",
        user_id=user_id,
        case_id=case_id
    )
    background_tasks.add_task(create_notification_in_background, payload)

def notify_hearing_scheduled(
    background_tasks: BackgroundTasks,
    hearing_id: int,
    case_id: int,
    court_room: str,
    hearing_date_str: str,
    user_id: Optional[int] = None
):
    """
    Queue background notification when a new Court Hearing is scheduled.
    """
    payload = NotificationCreate(
        type="HEARING_SCHEDULED",
        title="New Court Hearing Scheduled",
        message=f"Hearing scheduled in Courtroom {court_room} on {hearing_date_str}.",
        user_id=user_id,
        case_id=case_id,
        hearing_id=hearing_id
    )
    background_tasks.add_task(create_notification_in_background, payload)

def notify_document_uploaded(
    background_tasks: BackgroundTasks,
    document_id: int,
    case_id: int,
    document_title: str,
    document_type: str,
    user_id: Optional[int] = None
):
    """
    Queue background notification when a Legal Document is uploaded.
    """
    payload = NotificationCreate(
        type="DOCUMENT_UPLOADED",
        title=f"New Document Uploaded: {document_type}",
        message=f"Document '{document_title}' ({document_type}) has been added to the case vault.",
        user_id=user_id,
        case_id=case_id,
        document_id=document_id
    )
    background_tasks.add_task(create_notification_in_background, payload)

def notify_task_assigned(
    background_tasks: BackgroundTasks,
    task_id: int,
    task_title: str,
    case_id: Optional[int] = None,
    user_id: Optional[int] = None
):
    """
    Queue background notification when a Task or Reminder is assigned.
    """
    payload = NotificationCreate(
        type="TASK_ASSIGNED",
        title="New Legal Task Assigned",
        message=f"You have been assigned a new task: '{task_title}'.",
        user_id=user_id,
        case_id=case_id,
        task_id=task_id
    )
    background_tasks.add_task(create_notification_in_background, payload)
