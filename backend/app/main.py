import os
import sys
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings
from app.database import engine, Base, SessionLocal
from app.routers import auth, dashboard, client, case, hearing, document, notification, search

# Import models to ensure they are registered on Base before create_all
from app.models import user as user_model
from app.models import client as client_model
from app.models import case as case_model
from app.models import hearing as hearing_model
from app.models import task as task_model
from app.models import document as document_model
from app.models import notification as notification_model
from app.seed import seed_database

# Configure logging to flush immediately to Railway deploy logs
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("lexora")

# Automatically create all tables defined in models if they don't exist in MySQL
#Base.metadata.create_all(bind=engine)

# Run database seed check on startup


# --- Diagnostic: Log every incoming request to confirm Railway proxy connectivity ---
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        logger.info(f">>> INCOMING REQUEST: {request.method} {request.url} from {request.client}")
        try:
            response = await call_next(request)
            logger.info(f"<<< RESPONSE: {response.status_code} for {request.method} {request.url}")
            return response
        except Exception as e:
            logger.error(f"!!! REQUEST FAILED: {request.method} {request.url} -> {e}")
            raise


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup diagnostics ---
    port = os.environ.get("PORT", "NOT SET")
    logger.info("=" * 60)
    logger.info(f"DIAGNOSTIC: PORT env var = {port}")
    logger.info(f"DIAGNOSTIC: CORS_ORIGINS = {settings.CORS_ORIGINS}")
    logger.info(f"DIAGNOSTIC: DATABASE_URL set = {bool(settings.DATABASE_URL)}")
    logger.info(f"DIAGNOSTIC: Python version = {sys.version}")
    logger.info("=" * 60)
    sys.stdout.flush()
    yield
    logger.info("Application shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Legal Case Management System Backend Service",
    version=settings.VERSION,
    lifespan=lifespan,
)

# Request logging middleware (added BEFORE CORS so we see ALL requests)
app.add_middleware(RequestLoggingMiddleware)

# Configure CORS Middleware dynamically from central settings and allow all Vercel domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(client.router, prefix="/api/v1/clients", tags=["Clients"])
app.include_router(case.router, prefix="/api/v1/cases", tags=["Cases"])
app.include_router(hearing.router, prefix="/api/v1/hearings", tags=["Hearings"])
app.include_router(document.router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(notification.router, prefix="/api/v1/notifications", tags=["Notifications"])
app.include_router(search.router, prefix="/api/v1/search", tags=["Global Search"])




@app.get("/")
async def root():
    return {
        "message": "Welcome to Lexora API Services.",
        "docs_url": "/docs"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected"
    }

