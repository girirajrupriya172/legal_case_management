from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Notification(Base):
    """
    SQLAlchemy model representing a Notification in the system.
    Stores real-time events such as case updates, hearing reminders,
    document uploads, and task assignments for users.
    """
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    
    # Notification Classification (e.g., 'CASE_CREATED', 'HEARING_SCHEDULED', 'DOCUMENT_UPLOADED', 'TASK_ASSIGNED', etc.)
    type = Column(String(50), nullable=False, index=True)
    
    # Notification Title & Detailed Message Body
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    
    # Read status indicator (False = Unread, True = Read)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    
    # Foreign Keys linking to related resources in the system
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="SET NULL"), nullable=True)
    hearing_id = Column(Integer, ForeignKey("hearings.id", ondelete="SET NULL"), nullable=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    
    # Audit timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", backref="notifications")
    case = relationship("Case")
    hearing = relationship("Hearing")
    document = relationship("Document")
    task = relationship("Task")
