from fastapi import APIRouter
from app.core.config import settings
from app.services.gee_service import _gee_initialized
from app.services.supabase_service import get_supabase

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    supabase_connected = get_supabase() is not None
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "gee_connected": _gee_initialized,
        "supabase_connected": supabase_connected,
    }
