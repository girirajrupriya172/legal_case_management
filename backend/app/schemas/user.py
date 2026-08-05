from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

# Shared properties across schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: Optional[str] = "attorney"
    is_active: Optional[bool] = True

# Properties received on user creation (Signup)
class UserCreate(UserBase):
    password: str

# Properties returned in API responses (excluding password)
class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    # Tell Pydantic to read database ORM objects
    class Config:
        from_attributes = True

# Schema for login request
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Schema for JWT token response
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

# Schema for token payload data (claims)
class TokenData(BaseModel):
    email: Optional[str] = None

# Schema for token refresh request
class TokenRefreshRequest(BaseModel):
    refresh_token: str

# Schema for logout / token revocation request
class LogoutRequest(BaseModel):
    refresh_token: str

# Schema for forgot password request
class UserForgotPassword(BaseModel):
    email: EmailStr

# Schema for reset password request
class UserResetPassword(BaseModel):
    token: str
    new_password: str


