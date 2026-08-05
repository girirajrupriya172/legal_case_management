from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Case(Base):
    """
    SQLAlchemy model representing a Legal Case in the system.
    """
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    
    # Status can be: 'Ongoing', 'Won', 'Lost', 'Pending'
    status = Column(String(50), default="Pending", nullable=False)
    
    # Court Details (e.g. 'Supreme Court, Room 305' or 'Federal Court')
    court_details = Column(String(255), nullable=True)
    
    # Priority can be: 'High', 'Medium', 'Low'
    priority = Column(String(50), default="Medium", nullable=False)
    
    # Foreign Key linking this case to a Client
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    
    # Audit timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    client = relationship("Client", back_populates="cases")
    hearings = relationship("Hearing", back_populates="case", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="case", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="case", cascade="all, delete-orphan")


