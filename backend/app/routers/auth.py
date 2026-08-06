from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app.dependencies import get_db, get_current_user
from app.schemas.user import (
    UserCreate, UserResponse, UserLogin, Token, TokenRefreshRequest, 
    LogoutRequest, UserForgotPassword, UserResetPassword
)
from app.crud.user import get_user_by_email, create_user, update_user_password
from app.crud.refresh_token import (
    create_refresh_token_record, get_refresh_token, revoke_refresh_token
)
from app.core.security import (
    verify_password, create_access_token, create_refresh_token, verify_refresh_token,
    create_password_reset_token, verify_password_reset_token, get_password_hash,
    REFRESH_TOKEN_EXPIRE_DAYS
)
from app.models.user import User
from app.core.email import send_password_reset_email
from app.core.config import settings


# Initialize the router instance
router = APIRouter()

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
    description="Create a new user account in Lexora Legal Management System.",
    responses={
        201: {"description": "User account created successfully."},
        400: {"description": "Email address already registered."},
    },
)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account."""
    # Check if a user already exists with the same email
    existing_user = get_user_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )
    # Write the user record to the database
    new_user = create_user(db, user_in=user_in)
    return new_user

@router.post(
    "/login",
    response_model=Token,
    summary="User login & token issuance",
    description="Authenticate user credentials and return JWT access and refresh token pair.",
    responses={
        200: {"description": "Authentication successful, tokens returned."},
        401: {"description": "Invalid email or password credentials."},
        403: {"description": "User account deactivated or suspended."},
    },
)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate credentials and return JWT access token and refresh token."""
    # Retrieve user record by email
    user = get_user_by_email(db, email=login_data.email)
    
    # Verify user exists and the password is correct
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    # Check if the user is suspended
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated"
        )
        
    # Generate short-lived access token and long-lived refresh token
    access_token = create_access_token(subject=user.email)
    refresh_token = create_refresh_token(subject=user.email)
    
    # Store refresh token record in MySQL
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    create_refresh_token_record(
        db=db,
        token=refresh_token,
        user_id=user.id,
        expires_at=expires_at
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post(
    "/refresh",
    response_model=Token,
    summary="Rotate JWT refresh token",
    description="Verify refresh token, perform rotation, and return a new access/refresh pair.",
    responses={
        200: {"description": "Tokens rotated successfully."},
        401: {"description": "Invalid, expired, or revoked refresh token."},
    },
)
def refresh_token(request_data: TokenRefreshRequest, db: Session = Depends(get_db)):
    """Verify refresh token, perform token rotation, and return a new access/refresh pair."""
    # 1. Cryptographically decode and verify signature and payload type
    payload = verify_refresh_token(request_data.refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token signature"
        )
        
    # 2. Retrieve token from database to check server-side revocation status
    db_token = get_refresh_token(db, token=request_data.refresh_token)
    if not db_token or db_token.revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked or is invalid"
        )
        
    # 3. Check expiration timestamp against database
    now_utc = datetime.now(timezone.utc)
    expires_at = db_token.expires_at.replace(tzinfo=timezone.utc) if db_token.expires_at.tzinfo is None else db_token.expires_at
    if expires_at < now_utc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired"
        )
        
    # 4. Verify user exists and is active
    email = payload.get("sub")
    user = get_user_by_email(db, email=email)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer active"
        )
        
    # 5. TOKEN ROTATION: Revoke the used refresh token
    revoke_refresh_token(db, db_token)
    
    # 6. Issue a new access token and a new refresh token
    new_access_token = create_access_token(subject=user.email)
    new_refresh_token = create_refresh_token(subject=user.email)
    
    new_expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    create_refresh_token_record(
        db=db,
        token=new_refresh_token,
        user_id=user.id,
        expires_at=new_expires_at
    )
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="User logout",
    description="Revoke refresh token to securely terminate user session.",
    responses={
        200: {"description": "Session terminated successfully."},
    },
)
def logout(request_data: LogoutRequest, db: Session = Depends(get_db)):
    """Revoke the provided refresh token to securely terminate the session."""
    db_token = get_refresh_token(db, token=request_data.refresh_token)
    if db_token and not db_token.revoked:
        revoke_refresh_token(db, db_token)
        
    return {"message": "Successfully logged out"}

@router.post(
    "/forgot-password",
    status_code=status.HTTP_200_OK,
    summary="Request password reset",
    description="Dispatch password recovery email with 15-minute token link.",
    responses={
        200: {"description": "Recovery email dispatched or request acknowledged."},
    },
)
def forgot_password(
    request_data: UserForgotPassword,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db)
):
    """Accept an email and dispatch a password recovery link asynchronously."""
    user = get_user_by_email(db, email=request_data.email)
    
    success_message = {"message": "Recovery instructions have been sent to your email."}
    
    if not user or not user.is_active:
        return success_message
        
    reset_token = create_password_reset_token(email=user.email)
    
    # Determine base frontend URL from Request headers or config
    frontend_url = None
    origin = request.headers.get("origin")
    if origin:
        frontend_url = origin.rstrip("/")
    else:
        referer = request.headers.get("referer")
        if referer:
            from urllib.parse import urlparse
            parsed = urlparse(referer)
            frontend_url = f"{parsed.scheme}://{parsed.netloc}"
            
    if not frontend_url:
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")

    reset_url = f"{frontend_url}/reset-password?token={reset_token}"
    
    # Dispatch email sending to background tasks so HTTP response is returned immediately
    background_tasks.add_task(send_password_reset_email, email=user.email, token_url=reset_url)
    
    return success_message


@router.post(
    "/reset-password",
    status_code=status.HTTP_200_OK,
    summary="Complete password reset",
    description="Verify reset token and update user password.",
    responses={
        200: {"description": "Password updated successfully."},
        400: {"description": "Invalid or expired reset token."},
        404: {"description": "User account not found or suspended."},
    },
)
def reset_password(request_data: UserResetPassword, db: Session = Depends(get_db)):
    """Verify reset token and save the new password."""
    email = verify_password_reset_token(request_data.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
        
    user = get_user_by_email(db, email=email)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found or suspended"
        )
        
    hashed_password = get_password_hash(request_data.new_password)
    update_user_password(db, user=user, hashed_password=hashed_password)
    
    return {"message": "Password has been successfully updated"}

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
    description="Retrieve profile details of the currently authenticated user.",
    responses={
        200: {"description": "Current user profile data returned."},
        401: {"description": "Authentication token missing or invalid."},
    },
)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the profile data of the currently logged-in user."""
    return current_user
