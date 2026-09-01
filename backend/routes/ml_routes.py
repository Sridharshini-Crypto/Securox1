from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from ml_engine import anomaly_engine, FEATURE_NAMES
from research.lanl_dataset_loader import lanl_loader
from ml_engine import ml_engine
from research.lanl_dataset_loader import lanl_loader, LANL_FEATURE_NAMES
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
    redteam_target_ratio: Optional[float] = None
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
        "model_architecture": "Isolation Forest (150 Partition Trees)",
        "dataset_mode": "REAL_ORGANIC_CYBERSECURITY_DATASETS",
        "is_trained": ml_engine.is_trained,
        "input_feature_count": len(LANL_FEATURE_NAMES),
        "feature_names": LANL_FEATURE_NAMES,
        "training_metadata": ml_engine.training_metadata,
        "evaluation_metrics": ml_engine.evaluation_metrics,
        "active_datasets": inventory.get("datasets", {}),
        "explainability_mode": "Standardized Z-Score Contributing Signals"
    }

@router.get("/lineage")
async def get_data_lineage():
    """
    Returns complete 5-stage data lineage from raw disk files to SOC risk scores.
    """
    return ml_engine.get_data_lineage()

@router.get("/evaluation-metrics")
async def get_evaluation_metrics():
    """
    Returns post-hoc empirical precision, recall, and F1 score against Red Team ground truth.
    """
    if not ml_engine.is_trained:
        raise HTTPException(status_code=503, detail="Model is not yet trained on dataset.")
    return ml_engine.evaluation_metrics

@router.get("/datasets")
async def list_datasets():
    """
    Lists all authentic cybersecurity datasets found in the workspace.
    """
    return lanl_loader.get_dataset_inventory()

@router.post("/predict")
async def predict_custom_vector(features: RealLanlFeatureVectorInput):
    eval_res = anomaly_engine.predict_anomaly(features.dict())
    vec = [
        features.query_frequency or 5.0,
        features.unique_destinations or 2.0,
        features.destination_entropy or 1.2,
        features.query_rate_per_min or 5.0,
        features.destination_fanout_ratio or 0.4,
        features.new_destination_ratio or 0.0
    ]
    eval_res = ml_engine.predict_anomaly_score(vec)
    return {
        "status": "EVALUATED",
        "input_vector": features.dict(),
        "prediction_result": eval_res
    }

@router.get("/benchmark-lanl")
async def run_lanl_benchmark():
    if not anomaly_engine.is_trained:
    if not ml_engine.is_trained:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LANL Dataset files are not loaded in workspace. Benchmark cannot run on unavailable data."
            detail="Machine learning core is offline. Dataset not detected."
        )
    results = lanl_benchmark_engine.run_rigorous_evaluation()
    report = lanl_benchmark_engine.get_benchmark_summary()
    return {
        "status": "SUCCESS",
        "benchmark_report": results,
        "metrics": results["isolation_forest"],
        "baseline_comparison": results["baseline_comparison"]
        "benchmark_status": "COMPLETED",
        "metrics": report.get("isolation_forest", {}),
        "benchmark_report": report,
        "baseline_comparison": report.get("baseline_comparison", {}),
        "source_files": report.get("source_files", [])
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
