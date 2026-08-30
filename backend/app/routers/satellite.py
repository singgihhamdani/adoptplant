from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta

from app.services.gee_service import extract_polygon_ndvi_series, evaluate_recovery_status
from app.services.supabase_service import save_satellite_observations, get_supabase
from app.core.security import verify_token

router = APIRouter(prefix="/satellite", tags=["Satellite & GEE"])

class AnalyzePlotRequest(BaseModel):
    plot_id: str = Field(..., description="UUID of the rehabilitation plot")
    polygon_geojson: Dict[str, Any] = Field(..., description="GeoJSON Polygon geometry coordinates")
    start_date: Optional[str] = Field(None, description="Start date in YYYY-MM-DD format (default: 18 months ago)")
    end_date: Optional[str] = Field(None, description="End date in YYYY-MM-DD format (default: today)")
    auto_save_db: Optional[bool] = Field(True, description="Whether to automatically save observation records to Supabase")

class SatelliteObservationResponse(BaseModel):
    plot_id: str
    observation_date: str
    period_start: str
    period_end: str
    ndvi: float
    evi: Optional[float] = None
    ndmi: Optional[float] = None
    tree_cover_pct: Optional[float] = None
    vegetation_pct: Optional[float] = None
    cloud_cover_pct: float
    valid_pixel_pct: float
    source_dataset: str
    quality_flag: str

class AnalyzePlotResponse(BaseModel):
    plot_id: str
    success: bool
    observations_count: int
    recovery: Dict[str, Any]
    observations: List[Dict[str, Any]]
    message: str


@router.post("/analyze", response_model=AnalyzePlotResponse)
def analyze_plot_satellite(
    payload: AnalyzePlotRequest,
    user: dict = Depends(verify_token)
):
    """
    Trigger Sentinel-2 NDVI Time Series analysis for a plot polygon.
    Cloud masking (QA60 & SCL) is applied and data is aggregated monthly.
    """
    today = datetime.now()
    end_date = payload.end_date or today.strftime("%Y-%m-%d")
    
    # Default to 18 months of history to show clear temporal trajectory
    if not payload.start_date:
        start_dt = today - timedelta(days=540)
        start_date = start_dt.strftime("%Y-%m-%d")
    else:
        start_date = payload.start_date
        
    try:
        observations = extract_polygon_ndvi_series(
            plot_id=payload.plot_id,
            polygon_geojson=payload.polygon_geojson,
            start_date=start_date,
            end_date=end_date
        )
        
        recovery_eval = evaluate_recovery_status(observations)
        
        # Save to database if requested
        if payload.auto_save_db and observations:
            save_satellite_observations(observations)
            
        return AnalyzePlotResponse(
            plot_id=payload.plot_id,
            success=True,
            observations_count=len(observations),
            recovery=recovery_eval,
            observations=observations,
            message=f"Berhasil mengekstrak {len(observations)} observasi satelit Sentinel-2."
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memproses analisis satelit: {str(e)}")


@router.get("/plots/{plot_id}/time-series")
def get_plot_satellite_time_series(
    plot_id: str,
    user: dict = Depends(verify_token)
):
    """
    Retrieve stored satellite observations for a plot.
    """
    client = get_supabase()
    if client:
        try:
            res = client.table("satellite_observations").select("*").eq("plot_id", plot_id).order("observation_date", desc=False).execute()
            if res.data and len(res.data) > 0:
                recovery = evaluate_recovery_status(res.data)
                return {
                    "plot_id": plot_id,
                    "observations": res.data,
                    "recovery": recovery,
                    "source": "database"
                }
        except Exception:
            pass
            
    # Fallback to simulated data for dev/demo if none stored yet
    simulated = extract_polygon_ndvi_series(
        plot_id=plot_id,
        polygon_geojson={"type": "Polygon", "coordinates": [[[109.68, -7.38], [109.69, -7.38], [109.69, -7.39], [109.68, -7.39], [109.68, -7.38]]]},
        start_date=(datetime.now() - timedelta(days=540)).strftime("%Y-%m-%d"),
        end_date=datetime.now().strftime("%Y-%m-%d")
    )
    return {
        "plot_id": plot_id,
        "observations": simulated,
        "recovery": evaluate_recovery_status(simulated),
        "source": "simulation"
    }
