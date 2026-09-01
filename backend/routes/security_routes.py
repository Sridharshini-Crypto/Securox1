import json
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import SecurityEvent, ApiAuditLog, User, UserSession
from auth import get_current_user, require_permissions, enforce_abac_policy
from security_engine import ws_manager

router = APIRouter(prefix="/security", tags=["SOC Command Center & Securox Telemetry"])

@router.websocket("/ws")
async def websocket_soc_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo heartbeat
            await websocket.send_text(json.dumps({
                "type": "HEARTBEAT_ACK",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }))
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

@router.get("/stats")
async def get_soc_statistics(
    auth_data: tuple[User, UserSession] = Depends(enforce_abac_policy("AUDIT_LOGS", "READ", 1)),
    db: Session = Depends(get_db)
):
    total_events = db.query(SecurityEvent).count()
    critical_events = db.query(SecurityEvent).filter(SecurityEvent.severity == "critical").count()
    high_events = db.query(SecurityEvent).filter(SecurityEvent.severity == "high").count()
    elevated_events = db.query(SecurityEvent).filter(SecurityEvent.severity == "elevated").count()
    normal_events = db.query(SecurityEvent).filter(SecurityEvent.severity == "normal").count()

    total_audits = db.query(ApiAuditLog).count()
    blocked_requests = db.query(ApiAuditLog).filter(ApiAuditLog.was_blocked == True).count()

    # Current System Threat Score (Weighted 0 to 100%)
    threat_index = 10.0
    if critical_events > 0:
        threat_index = min(98.5, 45.0 + (critical_events * 12.5) + (high_events * 4.0))
    elif high_events > 0:
        threat_index = min(75.0, 25.0 + (high_events * 6.0))
    elif elevated_events > 0:
        threat_index = min(40.0, 15.0 + (elevated_events * 3.0))

    system_severity = (
        "CRITICAL" if threat_index >= 75.0 else
        "HIGH" if threat_index >= 50.0 else
        "ELEVATED" if threat_index >= 25.0 else "NORMAL"
    )

    # Compute real time-bucketed velocity curves (past 30 minutes in 5-minute increments)
    now = datetime.now(timezone.utc)
    velocity_buckets = []
    for i in range(5, -1, -1):
        bucket_start = now - timedelta(minutes=(i + 1) * 5)
        bucket_end = now - timedelta(minutes=i * 5)
        time_label = "Now" if i == 0 else f"{i*5}m ago"

        normal_count = db.query(ApiAuditLog).filter(
            ApiAuditLog.timestamp >= bucket_start,
            ApiAuditLog.timestamp <= bucket_end,
            ApiAuditLog.was_blocked == False
        ).count()

        anomaly_count = db.query(SecurityEvent).filter(
            SecurityEvent.timestamp >= bucket_start,
            SecurityEvent.timestamp <= bucket_end,
            SecurityEvent.severity.in_(["high", "critical", "elevated"])
        ).count()

        velocity_buckets.append({
            "time": time_label,
            "normal": max(1, normal_count),
            "anomaly": anomaly_count
        })

    return {
        "threat_index": round(threat_index, 1),
        "system_severity": system_severity,
        "velocity_data": velocity_buckets,
        "counts": {
            "total_security_events": total_events,
            "critical": critical_events,
            "high": high_events,
            "elevated": elevated_events,
            "normal": normal_events,
            "total_api_audits": total_audits,
            "blocked_requests": blocked_requests,
            "block_rate_percent": round((blocked_requests / (total_audits or 1)) * 100, 2)
        }
    }

@router.get("/events")
async def get_security_events(
    limit: int = 50,
    severity: Optional[str] = None,
    auth_data: tuple[User, UserSession] = Depends(enforce_abac_policy("AUDIT_LOGS", "READ", 1)),
    db: Session = Depends(get_db)
):
    query = db.query(SecurityEvent)
    if severity:
        query = query.filter(SecurityEvent.severity == severity.lower())
    
    events = query.order_by(SecurityEvent.id.desc()).limit(limit).all()
    
    serialized_events = []
    for e in events:
        evidence_list = e.get_evidence()
        is_sim = "UNRECOGNIZED" in (e.device_id or "") or "BOTNET" in (e.device_id or "") or "SIMULATED" in (e.mitigation_action or "")
        
        serialized_events.append({
            "id": e.id,
            "event_id": e.event_id,
            "event_type": e.event_type,
            "user_id": e.user_id,
            "role": e.role or "SYSTEM",
            "device_id": e.device_id or "DEV-UNKNOWN",
            "source_ip": e.source_ip,
            "location": e.location or "Austin, USA (HQ)",
            "endpoint": e.endpoint or "/api/gateway",
            "timestamp": e.timestamp.isoformat() if e.timestamp else datetime.now(timezone.utc).isoformat(),
            "anomaly_score": round(e.anomaly_score, 3),
            "severity": e.severity,
            "evidence": evidence_list,
            "mitigation_action": e.mitigation_action,
            "securox_forwarded": e.securox_forwarded,
            "is_simulated": is_sim,
            "origin_badge": "SIMULATED" if is_sim else "LIVE",
            "model_type": "Isolation Forest (LANL 7-D)"
        })

    return {
        "total_count": len(serialized_events),
        "events": serialized_events
    }

@router.get("/export-securox-stream")
async def export_securox_stream(
    auth_data: tuple[User, UserSession] = Depends(enforce_abac_policy("AUDIT_LOGS", "READ", 2)),
    db: Session = Depends(get_db)
):
    events = db.query(SecurityEvent).order_by(SecurityEvent.id.desc()).limit(100).all()
    
    securox_formatted = []
    for evt in events:
        securox_formatted.append({
            "securox_schema_version": "1.1.0",
            "source_subsystem": "SECUROX-GOVERNMENT-PORTAL",
            "event_id": evt.event_id,
            "timestamp": evt.timestamp.isoformat() if evt.timestamp else datetime.now(timezone.utc).isoformat(),
            "actor": {
                "user_id": evt.user_id,
                "role": evt.role,
                "clearance_level": 5 if evt.role == "SUPER_ADMIN" else 3
            },
            "network_context": {
                "source_ip": evt.source_ip,
                "device_fingerprint": evt.device_id,
                "location": evt.location
            },
            "telemetry_and_anomaly": {
                "target_endpoint": evt.endpoint,
                "event_type": evt.event_type,
                "anomaly_score": evt.anomaly_score,
                "severity": evt.severity.upper(),
                "contributing_signals": evt.get_evidence()
            },
            "zero_trust_policy_enforcement": {
                "mitigation_action": evt.mitigation_action,
                "decision": "BLOCKED" if evt.severity in ["critical", "high"] else "ALLOWED"
            }
        })

    return {
        "export_metadata": {
            "source_system": "SECUROX-GOV-ADMIN-PORTAL",
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "event_count": len(securox_formatted),
            "siem_compatibility": "SECUROX-CORRELATION-ENGINE-V2"
        },
        "securox_events": securox_formatted
    }
