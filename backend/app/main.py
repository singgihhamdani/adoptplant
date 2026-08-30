import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.services.gee_service import initialize_gee
from app.routers import health, satellite, analytics

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("rehabtrack.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting REHABTRACK GEE Analytics Service...")
    # Initialize GEE at startup
    initialize_gee()
    yield
    logger.info("Shutting down REHABTRACK GEE Analytics Service.")

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API Service for Google Earth Engine Sentinel-2 NDVI Time Series extraction and multi-source rehabilitation analytics.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Setup CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(health.router)
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(satellite.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "service": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
