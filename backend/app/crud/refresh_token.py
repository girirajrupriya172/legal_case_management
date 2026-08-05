from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.models.refresh_token import RefreshToken

def create_refresh_token_record(
    db: Session, 
    token: str, 
    user_id: int, 
    expires_at: datetime
) -> RefreshToken:
    """Create and persist a new JWT Refresh Token record in MySQL."""
    db_token = RefreshToken(
        token=token,
        user_id=user_id,
        expires_at=expires_at,
        revoked=False
    )
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token

def get_refresh_token(db: Session, token: str) -> Optional[RefreshToken]:
    """Retrieve a refresh token record by token string."""
    return db.query(RefreshToken).filter(RefreshToken.token == token).first()

def revoke_refresh_token(db: Session, db_token: RefreshToken) -> RefreshToken:
    """Mark a specific refresh token as revoked (revoked = True)."""
    db_token.revoked = True
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token

def revoke_all_user_tokens(db: Session, user_id: int) -> int:
    """Revoke all active refresh tokens associated with a given user ID."""
    count = db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.revoked == False
    ).update({"revoked": True})
    db.commit()
    return count
