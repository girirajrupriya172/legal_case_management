from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.core.security import SECRET_KEY, ALGORITHM
from app.crud.user import get_user_by_email
from app.models.user import User
from app.schemas.user import TokenData

# OAuth2 scheme configures token retrieval path from HTTP authorization header
# "tokenUrl" points to the login endpoint.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

def get_db():
    """Dependency to provide a clean database session context per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db), 
    token: str = Depends(oauth2_scheme)
) -> User:
    """Dependency to extract, decode, verify the JWT token and return the logged-in user."""
    # Define credentials validation exception
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode the token using our secret key and algorithm
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        # Catch signatures failures or expiration
        raise credentials_exception
        
    # Retrieve user from database by email (using sub claim)
    user = get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
        
    # Check if user is suspended/inactive
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Inactive user account"
        )
        
    return user
