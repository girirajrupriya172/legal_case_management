import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application settings schema loaded dynamically from environment variables and .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Core Application Settings
    PROJECT_NAME: str = "Lexora Legal Case Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Security & Authentication Settings (loaded dynamically from .env / OS env)
    SECRET_KEY: str = "CHANGE_THIS_SECRET_KEY_IN_ENV"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database Settings (loaded dynamically from .env / OS env)
    DATABASE_URL: str = "mysql+pymysql://user:password@localhost:3306/legalcase_management"

    # Storage Settings
    UPLOAD_DIR: str = "uploads"

    # CORS Settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    # Email / SMTP Settings (loaded dynamically from .env / OS env)
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = ""
    MAIL_FROM_NAME: str = "Lexora Legal Systems"
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_PORT: int = 587


settings = Settings()
