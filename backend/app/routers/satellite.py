from fastapi import APIRouter, HTTPException, Depends, Query
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
    start_date: Optional[str] = Field(None, description="Start date in YYYY-MM-DD format")
    end_date: Optional[str] = Field(None, description="End date in YYYY-MM-DD format (default: today)")
    timeframe_months: Optional[int] = Field(36, description="Number of historical months to analyze (12, 24, 36, 60)")
    planting_date: Optional[str] = Field(None, description="Official planting or baseline date of the plot")
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
    is_post_planting: Optional[bool] = None

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
    
    # Calculate start date from timeframe_months (default 36 months / 3 years)
    if not payload.start_date:
        months = payload.timeframe_months or 36
        start_dt = today - timedelta(days=months * 30)
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
        
        # Mark post-planting status if planting_date is known
        if payload.planting_date:
            p_dt = datetime.strptime(payload.planting_date, "%Y-%m-%d")
            for obs in observations:
                obs_dt = datetime.strptime(obs["observation_date"], "%Y-%m-%d")
                obs["is_post_planting"] = obs_dt >= p_dt
                
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
    months: int = Query(36, description="Months of time series history (12, 24, 36, 60)"),
    planting_date: Optional[str] = Query(None, description="Planting date YYYY-MM-DD"),
    user: dict = Depends(verify_token)
):
    """
    Retrieve stored satellite observations for a plot across the selected timeframe.
    """
    client = get_supabase()
    if client:
        try:
            res = client.table("satellite_observations").select("*").eq("plot_id", plot_id).order("observation_date", desc=False).execute()
            if res.data and len(res.data) > 0:
                # Mark post planting if known
                if planting_date:
                    p_dt = datetime.strptime(planting_date, "%Y-%m-%d")
                    for obs in res.data:
                        obs_dt = datetime.strptime(obs["observation_date"], "%Y-%m-%d")
                        obs["is_post_planting"] = obs_dt >= p_dt

                recovery = evaluate_recovery_status(res.data)
                return {
                    "plot_id": plot_id,
                    "observations": res.data,
                    "recovery": recovery,
                    "source": "database"
                }
        except Exception:
            pass
            
    # Fallback to dynamic time series calibrated with planting_date
    today = datetime.now()
    start_date = (today - timedelta(days=months * 30)).strftime("%Y-%m-%d")
    end_date = today.strftime("%Y-%m-%d")

    simulated = extract_polygon_ndvi_series(
        plot_id=plot_id,
        polygon_geojson={"type": "Polygon", "coordinates": [[[109.68, -7.38], [109.69, -7.38], [109.69, -7.39], [109.68, -7.39], [109.68, -7.38]]]},
        start_date=start_date,
        end_date=end_date
    )

    if planting_date:
        p_dt = datetime.strptime(planting_date, "%Y-%m-%d")
        for obs in simulated:
            obs_dt = datetime.strptime(obs["observation_date"], "%Y-%m-%d")
            obs["is_post_planting"] = obs_dt >= p_dt

    return {
        "plot_id": plot_id,
        "observations": simulated,
        "recovery": evaluate_recovery_status(simulated),
        "source": "simulation"
    }
