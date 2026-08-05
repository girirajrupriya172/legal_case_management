from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash

def get_user_by_id(db: Session, user_id: int) -> User:
    """Retrieve a single user record by database primary key ID."""
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> User:
    """Retrieve a single user record by unique email address."""
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user_in: UserCreate) -> User:
    """Create a new user, hashing their password before committing to the database."""
    # Hash the password to keep it secure
    hashed_password = get_password_hash(user_in.password)
    
    # Instantiate the SQLAlchemy model
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=user_in.role,
        is_active=user_in.is_active
    )
    
    # Save user to database
    db.add(db_user)
    db.commit()
    db.refresh(db_user) # Retrieve generated database fields (like id)
    
    return db_user

def update_user_password(db: Session, user: User, hashed_password: str) -> User:
    """Update the password hash of a user in the database."""
    user.hashed_password = hashed_password
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

