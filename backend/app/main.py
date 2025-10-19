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

# CORS configuration - Allow all origins for now
import sys
sys.stderr.write(f"[CORS DEBUG] Setting up CORS with wildcard origin\n")
sys.stderr.flush()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
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
