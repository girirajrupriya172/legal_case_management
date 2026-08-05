from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
from jose import jwt, JWTError
import bcrypt
from app.core.config import settings

# Cryptographic signing configuration loaded from central settings
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = settings.REFRESH_TOKEN_EXPIRE_DAYS

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Compare a plain text password with a hashed database password."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Generate a secure one-way bcrypt hash of a plaintext password."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generate a signed JWT access token containing a subject (typically user email)."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Structure the token payload (claims)
    to_encode = {
        "exp": expire, 
        "sub": str(subject),
        "type": "access"
    }
    
    # Encrypt/Sign the payload with our secret key
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: Union[str, Any]) -> str:
    """Generate a long-lived signed JWT refresh token valid for 7 days."""
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh"
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_refresh_token(token: str) -> Optional[dict]:
    """Verify refresh token signature and type, returning the payload if valid or None if invalid."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None

def create_password_reset_token(email: str) -> str:
    """Generate a signed JWT token for password resets, valid for 15 minutes."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode = {
        "exp": expire,
        "sub": email,
        "scope": "password_reset"
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_password_reset_token(token: str) -> Optional[str]:
    """Verify the reset token and return the associated email, or None if invalid."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("scope") != "password_reset":
            return None
        email: str = payload.get("sub")
        if email is None:
            return None
        return email
    except JWTError:
        return None


