from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
    RecentNotificationsResponse,
    NotificationListResponse
)
from app.crud.notification import (
    get_notifications,
    get_recent_notifications,
    get_notification_by_id,
    create_notification,
    mark_notification_as_read,
    mark_all_notifications_as_read,
    delete_notification
)

router = APIRouter()

@router.get(
    "",
    response_model=NotificationListResponse,
    summary="List notifications",
    description="Retrieve paginated notifications and unread counts for the authenticated user.",
    responses={
        200: {"description": "Notifications list returned successfully."},
        401: {"description": "Authentication token missing or invalid."},
    },
)
@router.get("/", response_model=NotificationListResponse, include_in_schema=False)
def read_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    unread_only: bool = Query(False, description="Filter for unread items only")
):
    """
    Retrieve paginated notifications for the authenticated user.
    """
    skip = (page - 1) * limit
    notifications, total, unread_count = get_notifications(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        unread_only=unread_only
    )
    
    return {
        "notifications": notifications,
        "unread_count": unread_count,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.get(
    "/recent",
    response_model=RecentNotificationsResponse,
    summary="Get recent notifications",
    description="Retrieve recent notifications and unread badge count for UI dropdown header.",
    responses={
        200: {"description": "Recent notifications and unread count returned."},
        401: {"description": "Authentication token missing or invalid."},
    },
)
def read_recent_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(5, ge=1, le=20, description="Number of recent notifications to retrieve")
):
    """
    Retrieve recent notifications and unread badge count for the header dropdown.
    """
    notifications, unread_count = get_recent_notifications(
        db=db,
        user_id=current_user.id,
        limit=limit
    )
    
    return {
        "notifications": notifications,
        "unread_count": unread_count
    }

@router.post(
    "",
    response_model=NotificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a notification",
    description="Create a new system or user alert notification record.",
    responses={
        201: {"description": "Notification created successfully."},
        401: {"description": "Authentication token missing or invalid."},
    },
)
@router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_new_notification(
    notification_in: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new notification (admin or system use).
    """
    if notification_in.user_id is None:
        notification_in.user_id = current_user.id
        
    created_item = create_notification(db=db, notification_in=notification_in)
    return created_item

@router.patch(
    "/read-all",
    summary="Mark all notifications as read",
    description="Mark all unread notifications as read for the authenticated user.",
    responses={
        200: {"description": "All notifications marked as read."},
        401: {"description": "Authentication token missing or invalid."},
    },
)
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark all unread notifications as read for the authenticated user.
    """
    updated_count = mark_all_notifications_as_read(db=db, user_id=current_user.id)
    return {
        "message": "All notifications marked as read successfully",
        "updated_count": updated_count
    }

@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Mark a single notification as read",
    description="Mark a specific notification as read by ID.",
    responses={
        200: {"description": "Notification marked as read."},
        401: {"description": "Authentication token missing or invalid."},
        404: {"description": "Notification record not found."},
    },
)
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark a single notification as read by ID.
    """
    updated_item = mark_notification_as_read(
        db=db,
        notification_id=notification_id,
        user_id=current_user.id
    )
    if not updated_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification with ID {notification_id} not found."
        )
    return updated_item

@router.delete(
    "/{notification_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a notification",
    description="Delete a notification record by ID.",
    responses={
        200: {"description": "Notification deleted successfully."},
        401: {"description": "Authentication token missing or invalid."},
        404: {"description": "Notification record not found."},
    },
)
def remove_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a notification record by ID.
    """
    success = delete_notification(
        db=db,
        notification_id=notification_id,
        user_id=current_user.id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification with ID {notification_id} not found."
        )
    return {"message": f"Notification {notification_id} deleted successfully."}
