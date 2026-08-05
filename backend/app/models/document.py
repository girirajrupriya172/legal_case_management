from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Document(Base):
    """
    SQLAlchemy model representing a Legal Document associated with a Case.
    Stores metadata including document type, physical file path on server disk,
    file size, MIME type, optional counsel notes, and references to the parent Case
    and uploading User.
    """
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Key linking this document to a specific Legal Case
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Original title / file title given by user or extracted from upload
    title = Column(String(255), nullable=False)
    
    # Category / Type of document:
    # 'FIR', 'Court Orders', 'Evidence', 'Affidavits', 'Agreements', 
    # 'Notices', 'Identity Proofs', 'Property Documents', 'Judgement Copies', 'Other Legal Files'
    document_type = Column(String(100), nullable=False)
    
    # Stored unique filename on the server filesystem (e.g. uuid_filename.pdf)
    file_name = Column(String(255), nullable=False)
    
    # Physical or relative server storage path
    file_path = Column(String(500), nullable=False)
    
    # Size of file in bytes (e.g. 1048576 for 1 MB)
    file_size = Column(Integer, nullable=False)
    
    # MIME type (e.g. 'application/pdf', 'image/jpeg', 'image/png')
    mime_type = Column(String(100), nullable=True)
    
    # Optional legal counsel notes or summary about this document
    notes = Column(Text, nullable=True)
    
    # Foreign Key linking to the User (lawyer/staff) who uploaded this document
    uploaded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Audit timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    case = relationship("Case", back_populates="documents")
    uploaded_by = relationship("User", back_populates="documents")
