from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import TrafficSignal, User, UserSession
from auth import get_current_user, require_permissions, enforce_abac_policy
from security_engine import security_engine
from research.lanl_dataset_loader import lanl_loader

router = APIRouter(prefix="/traffic", tags=["Smart City Traffic Infrastructure & Grid Control"])

class SignalOverrideRequest(BaseModel):
    intersection_code: str
    target_state: str
    automated_mode: Optional[bool] = False
    reason: Optional[str] = "Manual traffic control intervention"

class EmergencyCorridorRequest(BaseModel):
    corridor_name: str
    affected_intersections: List[str]
    duration_minutes: int

class IovInjectionRequest(BaseModel):
    attack_type: Optional[str] = "spoofing-SPEED" # "DoS", "spoofing-SPEED", "spoofing-RPM"
    sample_count: Optional[int] = 50

@router.get("/signals")
async def list_signals(
    auth_data: tuple[User, UserSession] = Depends(enforce_abac_policy("TRAFFIC_GRID", "READ", 1)),
    db: Session = Depends(get_db)
):
    signals = db.query(TrafficSignal).all()
    return {
        "grid_summary": {
            "total_intersections": len(signals),
            "emergency_corridors_active": len([s for s in signals if s.emergency_corridor_active]),
            "manual_overrides_active": len([s for s in signals if not s.automated_mode]),
            "average_congestion_percent": round(sum(s.congestion_level for s in signals) / (len(signals) or 1), 1)
        },
        "signals": [
            {
                "id": s.id,
                "intersection_code": s.intersection_code,
                "name": s.name,
                "district": s.district,
                "current_state": s.current_state,
                "congestion_level": s.congestion_level,
                "automated_mode": s.automated_mode,
                "emergency_corridor_active": s.emergency_corridor_active,
                "last_override_by": s.last_override_by,
                "last_override_time": s.last_override_time.isoformat() if s.last_override_time else None
            } for s in signals
        ]
    }

@router.post("/override-signal")
async def override_signal_state(
    req: SignalOverrideRequest,
    auth_data: tuple[User, UserSession] = Depends(enforce_abac_policy("TRAFFIC_GRID", "OVERRIDE_SIGNAL", 4)),
    db: Session = Depends(get_db)
):
    current_user, session = auth_data

    signal = db.query(TrafficSignal).filter(TrafficSignal.intersection_code == req.intersection_code).first()
    if not signal:
        raise HTTPException(status_code=404, detail="Intersection not found")

    old_state = signal.current_state
    signal.current_state = req.target_state
    signal.automated_mode = req.automated_mode if req.automated_mode is not None else False
    signal.last_override_by = current_user.full_name
    signal.last_override_time = datetime.now(timezone.utc)
    db.commit()

    source_ip = session.ip_address if session else "10.14.22.105"
    device_id = session.device_fingerprint if session else "DEV-TRAFFIC-WORKSTATION-01"
    location = f"{session.location_city}, {session.location_country}" if session else "Austin, USA (HQ)"

    await security_engine.monitor_api_invocation(
        db=db,
        user=current_user,
        endpoint="/api/traffic/override-signal",
        http_method="POST",
        source_ip=source_ip,
        device_id=device_id,
        location=location,
        status_code=200
    )

    return {
        "status": "SIGNAL_OVERRIDDEN",
        "intersection_code": signal.intersection_code,
        "name": signal.name,
        "previous_state": old_state,
        "current_state": signal.current_state,
        "automated_mode": signal.automated_mode,
        "operator": current_user.full_name,
        "timestamp": signal.last_override_time.isoformat()
    }

@router.post("/emergency-corridor")
async def set_emergency_corridor(
    req: EmergencyCorridorRequest,
    auth_data: tuple[User, UserSession] = Depends(enforce_abac_policy("TRAFFIC_GRID", "OVERRIDE_SIGNAL", 4)),
    db: Session = Depends(get_db)
):
    current_user, session = auth_data

    signals = db.query(TrafficSignal).filter(TrafficSignal.intersection_code.in_(req.affected_intersections)).all()
    for s in signals:
        s.emergency_corridor_active = True
        s.current_state = "EMERGENCY_OVERRIDE"
        s.automated_mode = False
        s.last_override_by = f"EMERGENCY PRIORITY: {current_user.full_name}"
        s.last_override_time = datetime.now(timezone.utc)
    db.commit()

    source_ip = session.ip_address if session else "10.14.22.105"
    device_id = session.device_fingerprint if session else "DEV-TRAFFIC-WORKSTATION-01"
    location = f"{session.location_city}, {session.location_country}" if session else "Austin, USA (HQ)"

    await security_engine.monitor_api_invocation(
        db=db,
        user=current_user,
        endpoint="/api/traffic/emergency-corridor",
        http_method="POST",
        source_ip=source_ip,
        device_id=device_id,
        location=location,
        status_code=200
    )

    return {
        "status": "EMERGENCY_CORRIDOR_ACTIVE",
        "corridor_name": req.corridor_name,
        "updated_intersections": len(signals),
        "priority_routing_active": True
    }

@router.post("/inject-iov-telemetry")
async def inject_iov_telemetry(
    req: IovInjectionRequest,
    auth_data: tuple[User, UserSession] = Depends(enforce_abac_policy("TRAFFIC_GRID", "READ", 2)),
    db: Session = Depends(get_db)
):
    current_user, session = auth_data
    try:
        df_samples = lanl_loader.load_traffic_iov_samples(specific_attack=req.attack_type, n_samples=req.sample_count)
        samples_list = df_samples.to_dict(orient="records")
        return {
            "status": "IOV_TELEMETRY_INGESTED",
            "dataset_origin": f"dataset/decimal/decimal_{req.attack_type}.csv",
            "total_can_messages": len(samples_list),
            "sample_telemetry": samples_list[:5]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to ingest IoV CAN telemetry: {str(e)}")
