from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ml_engine import anomaly_engine, FEATURE_NAMES
from research.lanl_dataset_loader import lanl_loader
from research.lanl_benchmark import lanl_benchmark_engine
from auth import get_current_user
from models import User

router = APIRouter(prefix="/ml", tags=["Machine Learning Anomaly Detection & Cybersecurity Datasets"])

class RealLanlFeatureVectorInput(BaseModel):
    query_frequency: Optional[float] = 5.0
    unique_destinations: Optional[float] = 2.0
    destination_entropy: Optional[float] = 1.2
    query_rate_per_min: Optional[float] = 5.0
    destination_fanout_ratio: Optional[float] = 0.4
    new_destination_ratio: Optional[float] = 0.0
    redteam_target_ratio: Optional[float] = 0.0
    # Backward compatibility fields
    login_freq: Optional[float] = None
    failed_login_count: Optional[float] = 0.0
    new_device: Optional[float] = 0.0
    location_delta_km: Optional[float] = 0.0
    privilege_shift: Optional[float] = 0.0
    endpoint_criticality: Optional[float] = 1.0

@router.get("/status")
async def get_model_status():
    inventory = lanl_loader.get_dataset_inventory()
    
    return {
        "model_architecture": "Isolation Forest (scikit-learn ensemble tree partitioner)",
        "dataset_mode": "REAL_WORLD_CYBERSECURITY_DATASETS",
        "dataset_status": anomaly_engine.dataset_status,
        "dataset_name": "Multi-Source Cybersecurity Datasets (LANL 2015, Network Intrusion Flow, Smart Traffic IoV)",
        "active_datasets": inventory["datasets"],
        "n_estimators": 150,
        "is_trained": anomaly_engine.is_trained,
        "input_feature_count": len(FEATURE_NAMES),
        "feature_names": FEATURE_NAMES,
        "feature_baselines": anomaly_engine.feature_baselines,
        "training_dataset_metadata": anomaly_engine.dataset_metadata,
        "explainability_mode": "Standardized Z-Score Contributing Signals & Outlier Deviation Attribution"
    }

@router.post("/predict")
async def predict_custom_vector(features: RealLanlFeatureVectorInput):
    eval_res = anomaly_engine.predict_anomaly(features.dict())
    return {
        "status": "EVALUATED",
        "input_vector": features.dict(),
        "prediction_result": eval_res
    }

@router.get("/benchmark-lanl")
async def run_lanl_benchmark():
    if not anomaly_engine.is_trained:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LANL Dataset files are not loaded in workspace. Benchmark cannot run on unavailable data."
        )
    results = lanl_benchmark_engine.run_rigorous_evaluation()
    return {
        "status": "SUCCESS",
        "benchmark_report": results,
        "metrics": results["isolation_forest"],
        "baseline_comparison": results["baseline_comparison"]
    }

@router.post("/retrain")
async def trigger_retraining(current_user: User = Depends(get_current_user)):
    if current_user.role.name != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Only SUPER_ADMIN can trigger Isolation Forest retraining")
    
    anomaly_engine._train_from_real_dataset()
    if not anomaly_engine.is_trained:
        raise HTTPException(status_code=400, detail="Cannot retrain: LANL dataset files are not available in workspace.")

    eval_metrics = lanl_benchmark_engine.run_rigorous_evaluation()
    return {
        "status": "RETRAINED",
        "message": "Isolation Forest successfully retrained directly from original cybersecurity dataset files.",
        "new_metrics": eval_metrics
    }
