import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger("lexora.database")

# Database Connection URL loaded dynamically from central settings
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

def create_resilient_engine():
    """Create engine for primary database URL, falling back to SQLite if MySQL is unreachable."""
    is_sqlite = SQLALCHEMY_DATABASE_URL.startswith("sqlite")
    connect_args = {"check_same_thread": False} if is_sqlite else {"connect_timeout": 5}
    
    try:
        test_engine = create_engine(
            SQLALCHEMY_DATABASE_URL,
            pool_pre_ping=True,
            connect_args=connect_args
        )
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info(f"Successfully connected to primary database at {SQLALCHEMY_DATABASE_URL.split('@')[-1]}")
        return test_engine
    except Exception as exc:
        logger.warning(f"Failed to connect to primary database ({exc}). Falling back to local SQLite database.")
        sqlite_url = "sqlite:///./legalcase_management.db"
        return create_engine(
            sqlite_url,
            pool_pre_ping=True,
            connect_args={"check_same_thread": False}
        )

# Create the resilient SQLAlchemy engine
engine = create_resilient_engine()

# Create SessionLocal class for database sessions
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Create Declarative Base class
Base = declarative_base()

# Automatically ensure tables exist on engine creation
try:
    # Import all models to ensure they are registered on Base before create_all
    import app.models.user
    import app.models.client
    import app.models.case
    import app.models.hearing
    import app.models.task
    import app.models.document
    import app.models.notification
    import app.models.refresh_token
    Base.metadata.create_all(bind=engine)
except Exception as _exc:
    pass

