from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Database Connection URL loaded dynamically from central settings
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Create the SQLAlchemy engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True
)

# Create SessionLocal class for database sessions
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Create Declarative Base class
Base = declarative_base()
