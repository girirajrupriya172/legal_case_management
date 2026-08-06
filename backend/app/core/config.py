import json
from typing import Annotated, Any, List
from pydantic import BeforeValidator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


def parse_cors_origins(v: Any) -> List[str]:
    """Parse CORS_ORIGINS from env vars robustly.

    Accepts:
      - A Python list (already parsed, e.g. from default)
      - A JSON array string: '["http://a.com","http://b.com"]'
      - A comma-separated string: 'http://a.com,http://b.com'
    """
    if isinstance(v, list):
        return v
    if isinstance(v, str):
        v = v.strip()
        # Try JSON array first
        if v.startswith("["):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [origin.strip() for origin in parsed]
            except (json.JSONDecodeError, ValueError):
                pass
        # Fall back to comma-separated
        return [origin.strip() for origin in v.split(",") if origin.strip()]
    return v


# NoDecode prevents pydantic-settings from running json.loads() at the source level.
# BeforeValidator then handles parsing before Pydantic's own type validation.
CorsOriginsList = Annotated[List[str], NoDecode, BeforeValidator(parse_cors_origins)]


class Settings(BaseSettings):
    """Central application settings schema loaded dynamically from environment variables and .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
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
    DATABASE_URL: str
    # Storage Settings
    UPLOAD_DIR: str = "uploads"

    # CORS Settings — uses NoDecode to bypass pydantic-settings' source-level JSON parsing
    CORS_ORIGINS: CorsOriginsList = [
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
