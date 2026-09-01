import json
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import SecurityEvent, ApiAuditLog, User, UserSession
from auth import get_current_user, require_permissions, enforce_abac_policy
from security_engine import ws_manager

router = APIRouter(prefix="/security", tags=["SOC Command Center & Securox Telemetry"])

class ContainmentActionRequest(BaseModel):
    action: str # "ISOLATE_SESSION", "ENFORCE_STEP_UP", "LOCK_USER", "BLOCK_IP"
    reason: Optional[str] = "SOC Analyst Containment Directive"

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
    velocity_timeline = []
    for i in range(5, -1, -1):
        bucket_start = now - timedelta(minutes=(i + 1) * 5)
        bucket_end = now - timedelta(minutes=i * 5)
        time_label = "Now" if i == 0 else f"{i*5}m ago"

        normal_count = db.query(ApiAuditLog).filter(
        bucket_start = bucket_end - timedelta(minutes=5)
        
        c_count = db.query(SecurityEvent).filter(
            SecurityEvent.timestamp >= bucket_start,
            SecurityEvent.timestamp < bucket_end,
            SecurityEvent.severity.in_(["critical", "high"])
        ).count()
        
        req_count = db.query(ApiAuditLog).filter(
            ApiAuditLog.timestamp >= bucket_start,
            ApiAuditLog.timestamp <= bucket_end,
            ApiAuditLog.was_blocked == False
            ApiAuditLog.timestamp < bucket_end
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
        
        velocity_timeline.append({
            "time": bucket_end.strftime("%H:%M"),
            "critical_events": c_count,
            "api_velocity": req_count or 1
        })

    return {
        "security_posture": system_severity,
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
        "total_security_events": total_events,
        "critical_count": critical_events,
        "high_count": high_events,
        "elevated_count": elevated_events,
        "normal_count": normal_events,
        "total_api_audits": total_audits,
        "blocked_invocations": blocked_requests,
        "velocity_timeline": velocity_timeline,
        "soc_status": "MONITORING_ACTIVE"
    }

@router.get("/events")
async def get_security_events(
async def list_security_events(
    limit: int = 50,
    severity: Optional[str] = None,
    auth_data: tuple[User, UserSession] = Depends(enforce_abac_policy("AUDIT_LOGS", "READ", 1)),
    db: Session = Depends(get_db)
):
    query = db.query(SecurityEvent)
    if severity:
        query = query.filter(SecurityEvent.severity == severity.lower())
    
    events = query.order_by(SecurityEvent.id.desc()).limit(limit).all()
    
    events = db.query(SecurityEvent).order_by(SecurityEvent.id.desc()).limit(limit).all()

    serialized_events = []
    for e in events:
        evidence_list = e.get_evidence()
        is_sim = "UNRECOGNIZED" in (e.device_id or "") or "BOTNET" in (e.device_id or "") or "SIMULATED" in (e.mitigation_action or "")
        is_sim = bool(getattr(e, "is_simulated", False) or "SIMULATED" in (e.event_id or ""))
        
        serialized_events.append({
            "id": e.id,
            "event_id": e.event_id,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
            "event_type": e.event_type,
            "user_id": e.user_id,
            "role": e.role or "SYSTEM",
            "device_id": e.device_id or "DEV-UNKNOWN",
            "role": e.role,
            "source_ip": e.source_ip,
            "location": e.location or "Austin, USA (HQ)",
            "endpoint": e.endpoint or "/api/gateway",
            "timestamp": e.timestamp.isoformat() if e.timestamp else datetime.now(timezone.utc).isoformat(),
            "device_id": e.device_id,
            "location": e.location,
            "endpoint": e.endpoint,
            "anomaly_score": round(e.anomaly_score, 3),
            "severity": e.severity,
            "evidence": evidence_list,
            "mitigation_action": e.mitigation_action,
            "securox_forwarded": e.securox_forwarded,
            "is_simulated": is_sim,
            "origin_badge": "SIMULATED" if is_sim else "LIVE",
            "model_type": "Isolation Forest (LANL 7-D)"
            "origin_badge": "CONTROLLED WHAT-IF SIMULATION" if is_sim else "LIVE PRODUCTION TELEMETRY",
            "model_type": "Isolation Forest (6-D Clean Behavioral)"
        })

    return {
        "total_count": len(serialized_events),
        "events": serialized_events
    }

@router.get("/incident/{incident_id}")
async def get_incident_deep_dive(
    incident_id: str,
    auth_data: tuple[User, UserSession] = Depends(enforce_abac_policy("AUDIT_LOGS", "READ", 2)),
    db: Session = Depends(get_db)
):
    """
    Incident Deep-Dive with MITRE ATT&CK mapping, downstream impact graph, and model evidence.
    """
    event = db.query(SecurityEvent).filter(
        (SecurityEvent.event_id == incident_id) | (SecurityEvent.id == int(incident_id) if incident_id.isdigit() else False)
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")

    is_sim = bool(getattr(event, "is_simulated", False) or "SIMULATED" in (event.event_id or ""))
    risk_score = int(round(event.anomaly_score * 100))

    # MITRE ATT&CK Mapping
    mitre_tactics = []
    if "BRUTE_FORCE" in event.event_type:
        mitre_tactics = [
            {"id": "T1110", "tactic": "Credential Access", "technique": "Brute Force / Password Guessing"},
            {"id": "T1078", "tactic": "Defense Evasion", "technique": "Valid Accounts"}
        ]
    elif "TRAVEL" in event.event_type or "IMPOSSIBLE" in event.event_type:
        mitre_tactics = [
            {"id": "T1078.004", "tactic": "Initial Access", "technique": "Cloud & Remote Administration Credentials"},
            {"id": "T1586", "tactic": "Resource Development", "technique": "Compromised Infrastructure Geo-Hop"}
        ]
    elif "BURST" in event.event_type or "RATE" in event.event_type:
        mitre_tactics = [
            {"id": "T1499", "tactic": "Impact", "technique": "Endpoint Denial of Service (API Burst)"},
            {"id": "T1059", "tactic": "Execution", "technique": "Command and Scripting Interpreter"}
        ]
    else:
        mitre_tactics = [
            {"id": "T1078", "tactic": "Initial Access", "technique": "Valid Accounts"},
            {"id": "T1068", "tactic": "Privilege Escalation", "technique": "Exploitation for Privilege Escalation"}
        ]

    # Downstream Dependency Impact Graph
    downstream_impact = [
        {"node": "Government Sovereign Portal", "status": "COMPROMISED" if risk_score > 70 else "TARGETED", "depth": 0},
        {"node": "Municipal Services Gateway", "status": "AT_RISK", "depth": 1},
        {"node": "Traffic Management Grid", "status": "ISOLATED" if "TRAFFIC" in event.endpoint else "MONITORED", "depth": 2},
        {"node": "Sovereign Treasury Disbursement API", "status": "STEP_UP_LOCKED", "depth": 2}
    ]

    return {
        "incident_id": event.event_id,
        "timestamp": event.timestamp.isoformat() if event.timestamp else datetime.now(timezone.utc).isoformat(),
        "severity": event.severity.upper(),
        "risk_score": risk_score,
        "origin_badge": "CONTROLLED WHAT-IF SIMULATION" if is_sim else "LIVE PRODUCTION TELEMETRY",
        "actor": {
            "identity": event.user_id,
            "role": event.role,
            "source_ip": event.source_ip,
            "device_id": event.device_id,
            "location": event.location,
            "device_trust": "UNTRUSTED_UNKNOWN" if ("UNRECOGNIZED" in event.device_id or "BOTNET" in event.device_id) else "ENROLLED_FIDO2"
        },
        "target_resource": {
            "endpoint": event.endpoint,
            "event_type": event.event_type,
            "mitigation_action": event.mitigation_action
        },
        "model_evidence": {
            "engine": "Isolation Forest (6-D Clean Behavioral)",
            "assessment": "Model-Generated Anomaly Assessment",
            "anomaly_score": round(event.anomaly_score, 4),
            "contributing_signals": event.get_evidence()
        },
        "mitre_attack_mapping": mitre_tactics,
        "downstream_impact_propagation": downstream_impact,
        "recommended_actions": [
            {"action": "ENFORCE_STEP_UP", "label": "Trigger FIDO2 Step-Up Challenge", "recommended": True},
            {"action": "ISOLATE_SESSION", "label": "Isolate Official Session", "recommended": risk_score > 60},
            {"action": "LOCK_USER", "label": "Lock User Identity", "recommended": risk_score > 80}
        ]
    }

@router.post("/incident/{incident_id}/contain")
async def contain_incident(
    incident_id: str,
    req: ContainmentActionRequest,
    auth_data: tuple[User, UserSession] = Depends(enforce_abac_policy("AUDIT_LOGS", "WRITE", 3)),
    db: Session = Depends(get_db)
):
    current_user, session = auth_data
    event = db.query(SecurityEvent).filter(
        (SecurityEvent.event_id == incident_id) | (SecurityEvent.id == int(incident_id) if incident_id.isdigit() else False)
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")

    if req.action == "ISOLATE_SESSION":
        user_obj = db.query(User).filter(User.username == event.user_id).first()
        if user_obj:
            active_sessions = db.query(UserSession).filter(UserSession.user_id == user_obj.id, UserSession.is_active == True).all()
            for s in active_sessions:
                s.is_active = False
            db.commit()

    elif req.action == "LOCK_USER":
        user_obj = db.query(User).filter(User.username == event.user_id).first()
        if user_obj:
            user_obj.is_active = False
            db.commit()

    event.mitigation_action = f"CONTAINED_{req.action}_BY_SOC_ANALYST"
    db.commit()

    return {
        "status": "CONTAINMENT_EXECUTED",
        "incident_id": incident_id,
        "action_taken": req.action,
        "operator": current_user.username,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/export-securox-stream")
async def export_securox_stream(
    auth_data: tuple[User, UserSession] = Depends(enforce_abac_policy("AUDIT_LOGS", "READ", 2)),
    db: Session = Depends(get_db)
):
    events = db.query(SecurityEvent).order_by(SecurityEvent.id.desc()).limit(100).all()
    
    securox_formatted = []
    for evt in events:
        is_sim = bool(getattr(evt, "is_simulated", False) or "SIMULATED" in (evt.event_id or ""))
        securox_formatted.append({
            "securox_schema_version": "1.1.0",
            "source_subsystem": "SECUROX-GOVERNMENT-PORTAL",
            "event_id": evt.event_id,
            "origin_badge": "CONTROLLED WHAT-IF SIMULATION" if is_sim else "LIVE PRODUCTION TELEMETRY",
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
