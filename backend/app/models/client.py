from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Client(Base):
    """
    SQLAlchemy model representing a Client in the legal firm system.
    """
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    address = Column(String(255), nullable=True)
    
    # Audit timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    # A Client can have multiple cases. cascade="all, delete-orphan" ensures when a client
    # is deleted, all their associated cases are also cleaned up in MySQL.
    cases = relationship("Case", back_populates="client", cascade="all, delete-orphan")
    hearings = relationship("Hearing", back_populates="client", cascade="all, delete-orphan")
