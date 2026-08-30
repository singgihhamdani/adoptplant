from fastapi import APIRouter, Depends
from typing import Dict, Any
from app.services.supabase_service import get_supabase
from app.services.gee_service import evaluate_recovery_status
from app.core.security import verify_token

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/plots/{plot_id}/recovery-status")
def get_plot_recovery_status(
    plot_id: str,
    user: dict = Depends(verify_token)
) -> Dict[str, Any]:
    """
    Synthesize multi-source evidence (Field Survival Rate + Satellite NDVI Slope)
    to establish the verified recovery status of a rehabilitation plot.
    """
    client = get_supabase()
    
    field_data = []
    satellite_data = []
    
    if client:
        try:
            m_res = client.table("field_monitorings").select("date, survival_rate, healthy_count, total_planted:healthy_count").eq("plot_id", plot_id).order("date", desc=True).execute()
            field_data = m_res.data or []
            
            s_res = client.table("satellite_observations").select("*").eq("plot_id", plot_id).order("observation_date", desc=False).execute()
            satellite_data = s_res.data or []
        except Exception:
            pass
            
    sat_eval = evaluate_recovery_status(satellite_data)
    
    latest_survival_rate = field_data[0].get("survival_rate") if field_data else None
    
    # Combined Composite Evidence Scoring
    # 50% Field Evidence (Survival Rate) + 50% Satellite Evidence (NDVI Growth)
    sat_score = sat_eval["recovery_score"]
    field_score = float(latest_survival_rate) if latest_survival_rate is not None else 70.0
    
    composite_score = round((field_score * 0.5) + (sat_score * 0.5), 1)
    
    if composite_score >= 75.0:
        verified_status = "RECOVERING"
        verdict = "Pemulihan Berhasil Terbukti (Bukti Lapangan & Satelit Selaras Positif)"
    elif composite_score >= 50.0:
        verified_status = "MONITORING"
        verdict = "Stabil dalam Pemantauan Rutin"
    else:
        verified_status = "AT_RISK"
        verdict = "Perlu Tindakan Intervensi Cepat"
        
    return {
        "plot_id": plot_id,
        "verified_status": verified_status,
        "composite_recovery_score": composite_score,
        "field_evidence": {
            "latest_survival_rate": latest_survival_rate,
            "monitorings_count": len(field_data),
            "score": field_score
        },
        "satellite_evidence": {
            "baseline_ndvi": sat_eval["baseline_ndvi"],
            "latest_ndvi": sat_eval["latest_ndvi"],
            "delta_ndvi": sat_eval["delta_ndvi"],
            "score": sat_score,
            "interpretation": sat_eval["interpretation"]
        },
        "verdict": verdict
    }
