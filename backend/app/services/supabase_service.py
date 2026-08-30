import logging
from typing import Optional, List, Dict, Any
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger("rehabtrack.supabase")

_supabase_client: Optional[Client] = None

def get_supabase() -> Optional[Client]:
    """
    Get Supabase Python client using Service Role Key.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client
        
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        logger.warning("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured.")
        return None
        
    try:
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None

def save_satellite_observations(observations: List[Dict[str, Any]]) -> bool:
    """
    Upsert/Insert satellite observation records into Supabase `satellite_observations` table.
    """
    client = get_supabase()
    if not client:
        logger.info(f"Supabase client not connected. Simulated save of {len(observations)} observation records.")
        return True
        
    try:
        # Insert records into public.satellite_observations
        res = client.table("satellite_observations").upsert(observations).execute()
        logger.info(f"Successfully saved {len(observations)} satellite records to Supabase.")
        return True
    except Exception as e:
        logger.error(f"Error inserting satellite observations to Supabase: {e}")
        return False
