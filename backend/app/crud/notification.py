from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, Tuple, List
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate, NotificationUpdate

def get_notification_by_id(db: Session, notification_id: int) -> Optional[Notification]:
    """
    Retrieve a single notification by primary key ID.
    """
    return db.query(Notification).filter(Notification.id == notification_id).first()

def get_unread_count(db: Session, user_id: Optional[int] = None) -> int:
    """
    Count unread notifications for a specific user (or global if user_id is None).
    """
    query = db.query(Notification).filter(Notification.is_read == False)
    if user_id is not None:
        query = query.filter(or_(Notification.user_id == user_id, Notification.user_id.is_(None)))
    return query.count()

def get_recent_notifications(
    db: Session,
    user_id: Optional[int] = None,
    limit: int = 5
) -> Tuple[List[Notification], int]:
    """
    Retrieve the most recent notifications for the header dropdown along with total unread count.
    """
    query = db.query(Notification)
    if user_id is not None:
        query = query.filter(or_(Notification.user_id == user_id, Notification.user_id.is_(None)))
    
    recent_items = (
        query.order_by(Notification.created_at.desc())
        .limit(limit)
        .all()
    )
    
    unread_count = get_unread_count(db, user_id=user_id)
    return recent_items, unread_count

def get_notifications(
    db: Session,
    user_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 20,
    unread_only: bool = False
) -> Tuple[List[Notification], int, int]:
    """
    Retrieve notifications with pagination and unread status filter.
    Returns a tuple of (notifications_list, total_count, unread_count).
    """
    query = db.query(Notification)
    if user_id is not None:
        query = query.filter(or_(Notification.user_id == user_id, Notification.user_id.is_(None)))
        
    if unread_only:
        query = query.filter(Notification.is_read == False)
        
    total = query.count()
    
    notifications = (
        query.order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    unread_count = get_unread_count(db, user_id=user_id)
    return notifications, total, unread_count

def create_notification(db: Session, notification_in: NotificationCreate) -> Notification:
    """
    Create and persist a new notification record in the database.
    """
    db_notification = Notification(
        type=notification_in.type,
        title=notification_in.title,
        message=notification_in.message,
        is_read=notification_in.is_read if notification_in.is_read is not None else False,
        user_id=notification_in.user_id,
        case_id=notification_in.case_id,
        hearing_id=notification_in.hearing_id,
        document_id=notification_in.document_id,
        task_id=notification_in.task_id
    )
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification

def mark_notification_as_read(
    db: Session,
    notification_id: int,
    user_id: Optional[int] = None
) -> Optional[Notification]:
    """
    Mark a single notification as read (is_read = True).
    """
    query = db.query(Notification).filter(Notification.id == notification_id)
    if user_id is not None:
        query = query.filter(or_(Notification.user_id == user_id, Notification.user_id.is_(None)))
        
    db_notification = query.first()
    if db_notification:
        db_notification.is_read = True
        db.commit()
        db.refresh(db_notification)
    return db_notification

def mark_all_notifications_as_read(db: Session, user_id: Optional[int] = None) -> int:
    """
    Mark all unread notifications as read for a given user.
    Returns the count of updated notification records.
    """
    query = db.query(Notification).filter(Notification.is_read == False)
    if user_id is not None:
        query = query.filter(or_(Notification.user_id == user_id, Notification.user_id.is_(None)))
        
    updated_count = query.update({Notification.is_read: True}, synchronize_session=False)
    db.commit()
    return updated_count

def delete_notification(
    db: Session,
    notification_id: int,
    user_id: Optional[int] = None
) -> bool:
    """
    Delete a notification record by primary key ID.
    Returns True if deleted, False if not found.
    """
    query = db.query(Notification).filter(Notification.id == notification_id)
    if user_id is not None:
        query = query.filter(or_(Notification.user_id == user_id, Notification.user_id.is_(None)))
        
    db_notification = query.first()
    if db_notification:
        db.delete(db_notification)
        db.commit()
        return True
    return False
