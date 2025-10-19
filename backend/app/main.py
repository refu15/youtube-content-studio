import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings

# Suppress gRPC ALTS warnings
os.environ.setdefault('GRPC_VERBOSITY', 'ERROR')
os.environ.setdefault('GLOG_minloglevel', '2')

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS configuration
allowed_origins = settings.get_allowed_origins()
if not allowed_origins or allowed_origins == ['']:
    allowed_origins = ["*"]

# Debug: Print CORS configuration
import sys
sys.stderr.write(f"[CORS DEBUG] Allowed origins: {allowed_origins}\n")
sys.stderr.flush()

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True if allowed_origins != ["*"] else False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)


@app.get("/")
async def root():
    return {
        "message": "YouTube Content Studio AI API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Import and include routers
from .api import planning, trends, viral, analytics, reports

app.include_router(
    planning.router,
    prefix=f"{settings.API_V1_STR}/planning",
    tags=["planning"]
)

app.include_router(
    trends.router,
    prefix=f"{settings.API_V1_STR}/trends",
    tags=["trends"]
)

app.include_router(
    viral.router,
    prefix=f"{settings.API_V1_STR}/viral",
    tags=["viral"]
)

app.include_router(
    analytics.router,
    prefix=f"{settings.API_V1_STR}/analytics",
    tags=["analytics"]
)

app.include_router(
    reports.router,
    prefix=f"{settings.API_V1_STR}/reports",
    tags=["reports"]
)
