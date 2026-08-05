from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Task(Base):
    """
    SQLAlchemy model representing a Task or Reminder in the system.
    """
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    
    # Status can be: 'Pending', 'Completed'
    status = Column(String(50), default="Pending", nullable=False)

    # Foreign Keys
    # A task can optionally be associated with a specific case
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=True)
    # A task is assigned to an attorney (User)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Audit timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    case = relationship("Case", back_populates="tasks")
    user = relationship("User")
