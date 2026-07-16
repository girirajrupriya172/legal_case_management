from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Lexora API",
    description="Legal Case Management System Backend Service",
    version="1.0.0",
)

# Configure CORS Middleware
# Allowing all origins during initial setup, but in production we will restrict this to specific domains.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        "database": "not_connected_yet"
    }
