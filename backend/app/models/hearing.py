from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Hearing(Base):
    """
    SQLAlchemy model representing a scheduled Court Hearing in the system.
    """
    __tablename__ = "hearings"

    id = Column(Integer, primary_key=True, index=True)
    hearing_date = Column(DateTime(timezone=True), nullable=False)
    court_room = Column(String(100), nullable=False)
    judge_name = Column(String(100), nullable=True)
    hearing_type = Column(String(100), nullable=True, default="Trial")
    notes = Column(Text, nullable=True)
    outcome = Column(Text, nullable=True)
    
    # Status can be: 'Scheduled', 'Ongoing', 'Pending', 'Completed', 'Adjourned', 'Cancelled'
    status = Column(String(50), default="Scheduled", nullable=False)

    # Foreign Keys
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)

    # Audit timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    case = relationship("Case", back_populates="hearings")
    client = relationship("Client", back_populates="hearings")

