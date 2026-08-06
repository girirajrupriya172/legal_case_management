from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

# Automatically create all tables defined in models if they don't exist in MySQL
#Base.metadata.create_all(bind=engine)

# Run database seed check on startup

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Legal Case Management System Backend Service",
    version=settings.VERSION,
)

# Configure CORS Middleware dynamically from central settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
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
