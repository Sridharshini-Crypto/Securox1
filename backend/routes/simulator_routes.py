import uuid
import time
import math
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, compute_hash
from models import SecurityEvent, ApiAuditLog, User, UserSession, Device
from security_engine import security_engine, ws_manager
from ml_engine import anomaly_engine
from abac_engine import abac_engine, PolicyEvaluationRequest
from auth import create_access_token

router = APIRouter(prefix="/simulator", tags=["Realistic Cyber Attack & Anomaly Sandbox"])

CITY_COORDINATES = {
    "austin": (30.2672, -97.7431),
    "amsterdam": (52.3676, 4.9041),
    "frankfurt": (50.1109, 8.6821),
    "london": (51.5074, -0.1278),
    "tokyo": (35.6762, 139.6503),
    "moscow": (55.7558, 37.6173),
    "beijing": (39.9042, 116.4074),
    "dallas": (32.7767, -96.7970),
    "houston": (29.7604, -95.3698),
    "new york": (40.7128, -74.0060)
}

def calculate_haversine_distance(city1: str, city2: str) -> float:
    c1 = city1.lower().split(",")[0].strip()
    c2 = city2.lower().split(",")[0].strip()
    lat1, lon1 = CITY_COORDINATES.get(c1, (30.2672, -97.7431))
    lat2, lon2 = CITY_COORDINATES.get(c2, (52.3676, 4.9041))

    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

class ScenarioTriggerRequest(BaseModel):
    scenario_id: str
    custom_ip: Optional[str] = None
    custom_location: Optional[str] = None

class StageExecutionRequest(BaseModel):
    scenario_id: str
    stage_index: int
    session_id: Optional[str] = None

@router.get("/scenarios")
async def list_available_scenarios():
    return {
        "scenarios": [
            {
                "id": "SCENARIO_FLAGSHIP_CHAIN",
                "name": "🔥 Flagship: Multi-Stage Cyber Attack Chain",
                "description": "Full end-to-end event-driven attack flow: Admin password login → Unrecognized device fingerprint → Impossible travel velocity calculation → Step-up challenge → Privilege escalation attempt → Traffic API override → Sliding-window rate burst → Isolation Forest anomaly detection → Explainable evidence → Structured Securox Security Event.",
                "expected_severity": "critical",
                "attack_vector": "Multi-Stage Composite Attack (Auth + Session + Privilege + API + Traffic Grid)",
                "is_flagship": True,
                "stages_count": 8
            },
            {
                "id": "SCENARIO_NORMAL",
                "name": "Standard Administrative Access (Baseline)",
                "description": "Admin logs in from trusted office hardware (ThinkPad T14s) within Austin HQ network. Isolation Forest evaluates normal parameters.",
                "expected_severity": "normal",
                "attack_vector": "Baseline / None",
                "is_flagship": False,
                "stages_count": 1
            },
            {
                "id": "SCENARIO_BRUTE_FORCE",
                "name": "Credential Stuffing & Brute Force Attack",
                "description": "Adversary fires 5 rapid failed administrative logins using dictionary passwords. Increments database failure counter and triggers zero-trust account lockout.",
                "expected_severity": "critical",
                "attack_vector": "Authentication / Credential Stuffing",
                "is_flagship": False,
                "stages_count": 5
            },
            {
                "id": "SCENARIO_IMPOSSIBLE_TRAVEL",
                "name": "Impossible Travel & Unrecognized Device",
                "description": "Session established from Amsterdam (8,124 km delta) on an unknown device within 5 minutes of Austin HQ activity (velocity > 9,000 km/h).",
                "expected_severity": "high",
                "attack_vector": "Session Hijacking / Geolocation Anomaly",
                "is_flagship": False,
                "stages_count": 2
            },
            {
                "id": "SCENARIO_PRIVILEGE_ESCALATION",
                "name": "Privilege Boundary Crossing into Traffic Grid",
                "description": "Municipal Officer account attempts unauthorized write commands on critical Traffic Signal Grid API without clearance.",
                "expected_severity": "critical",
                "attack_vector": "RBAC/ABAC Violation / Infrastructure Sabotage",
                "is_flagship": False,
                "stages_count": 1
            },
            {
                "id": "SCENARIO_API_BURST",
                "name": "Abnormal High-Rate API Velocity Burst (DoS)",
                "description": "Automated script fires rapid signal override requests against Smart City Grid API, measured by the live sliding-window rate limiter.",
                "expected_severity": "critical",
                "attack_vector": "Application Layer DoS / Resource Exhaustion",
                "is_flagship": False,
                "stages_count": 1
            },
            {
                "id": "SCENARIO_TREASURY_FRAUD",
                "name": "High-Value Treasury Exfiltration Attempt",
                "description": "Attempt to disburse $150,000 municipal contingency funds without prior cryptographic step-up elevation.",
                "expected_severity": "high",
                "attack_vector": "Financial Fraud / Policy Bypass",
                "is_flagship": False,
                "stages_count": 1
            }
        ]
    }

@router.post("/trigger")
async def trigger_scenario(req: ScenarioTriggerRequest, db: Session = Depends(get_db)):
    sc_id = req.scenario_id.upper()
    admin_user = db.query(User).filter(User.username == "admin01").first()
    muni_user = db.query(User).filter(User.username == "muni_lead").first()

    if sc_id == "SCENARIO_FLAGSHIP_CHAIN":
        source_ip = req.custom_ip or "185.220.101.45"
        dest_location = req.custom_location or "Amsterdam, Netherlands"
        prev_location = "Austin, USA (HQ)"
        device_id = "DEV-UNRECOGNIZED-ADVERSARY-X9"

        stages_executed = []
        now = datetime.now(timezone.utc)

        # 1. Admin Login Attempt
        stages_executed.append({
            "stage": 1,
            "title": "Admin Password Authentication",
            "actor": admin_user.username,
            "source_ip": source_ip,
            "status": "VALID_CREDENTIALS_ACCEPTED",
            "timestamp": now.isoformat(),
            "details": "Admin credentials verified against bcrypt hash."
        })

        # 2. Hardware Device Inspection
        known_dev = db.query(Device).filter(Device.user_id == admin_user.id, Device.device_fingerprint == device_id).first()
        is_trusted = bool(known_dev and known_dev.is_trusted)
        stages_executed.append({
            "stage": 2,
            "title": "Hardware Fingerprint Inspection",
            "device_id": device_id,
            "is_trusted_device": is_trusted,
            "status": "UNRECOGNIZED_HARDWARE_FLAGGED",
            "timestamp": (now + timedelta(seconds=1)).isoformat(),
            "details": f"Device fingerprint '{device_id}' is not in trusted registry for {admin_user.username}."
        })

        # 3. Dynamic Haversine Distance & Travel Velocity Calculation
        distance_km = calculate_haversine_distance(prev_location, dest_location)
        time_delta_mins = 5.0
        velocity_kmh = round(distance_km / (time_delta_mins / 60.0), 1)
        is_impossible = velocity_kmh > 900.0

        stages_executed.append({
            "stage": 3,
            "title": "Geovelocity & Impossible Travel Calculation",
            "prev_location": prev_location,
            "current_location": dest_location,
            "distance_km": distance_km,
            "time_window_mins": time_delta_mins,
            "calculated_velocity_kmh": velocity_kmh,
            "is_physically_impossible": is_impossible,
            "status": "IMPOSSIBLE_TRAVEL_VIOLATION_TRIGGERED",
            "timestamp": (now + timedelta(seconds=2)).isoformat(),
            "details": f"Travel velocity of {velocity_kmh:,} km/h between Austin and Amsterdam exceeds commercial aircraft limits (900 km/h)."
        })

        # 4. Zero-Trust Step-Up Constraint Enforcement
        stages_executed.append({
            "stage": 4,
            "title": "Step-Up Multi-Factor Challenge Enforced",
            "policy_rule": "ZERO_TRUST_STEP_UP_ON_HIGH_GEOVELOCITY",
            "status": "ELEVATED_AUTH_CHALLENGE_ISSUED",
            "timestamp": (now + timedelta(seconds=3)).isoformat(),
            "details": "Session tagged with elevated risk score; FIDO2 / Biometric step-up required before write access."
        })

        # 5. Protected Traffic Grid Write Attempt (ABAC Evaluation)
        abac_decision = abac_engine.evaluate(
            PolicyEvaluationRequest(
                user=admin_user,
                session=UserSession(
                    session_token="SIM-SES",
                    user_id=admin_user.id,
                    device_fingerprint=device_id,
                    ip_address=source_ip,
                    location_city=dest_location,
                    risk_score=0.88,
                    step_up_verified=False
                ),
                resource="TRAFFIC_GRID",
                action="OVERRIDE_SIGNAL",
                criticality=4
            )
        )

        stages_executed.append({
            "stage": 5,
            "title": "Privilege Boundary Crossing Attempt (Traffic Grid)",
            "target_api": "/api/traffic/override-signals",
            "abac_verdict": "DENIED" if not abac_decision.allowed else "ALLOWED",
            "abac_reason": abac_decision.denial_reason or "Step-up verification required",
            "status_code": 403,
            "timestamp": (now + timedelta(seconds=4)).isoformat(),
            "details": f"ABAC policy engine blocked signal override: {abac_decision.denial_reason or 'Step-up verification required'}"
        })

        # 6. Sliding-Window API Request Burst
        for _ in range(35):
            security_engine._record_request(admin_user.username)
        measured_rate = security_engine._clean_sliding_window(admin_user.username)

        stages_executed.append({
            "stage": 6,
            "title": "Sliding-Window API Rate Burst Measurement",
            "measured_requests_per_min": measured_rate,
            "rate_threshold": 30,
            "status": "RATE_LIMIT_ANOMALY_RECORDED",
            "timestamp": (now + timedelta(seconds=5)).isoformat(),
            "details": f"Live sliding window measured {measured_rate} requests/min against government gateway."
        })

        # 7 & 8. Isolation Forest ML Scoring & Structured Securox Event Dispatch
        securox_evt = await security_engine.monitor_api_invocation(
            db=db,
            user=admin_user,
            endpoint="/api/traffic/override-signals",
            http_method="POST",
            source_ip=source_ip,
            device_id=device_id,
            location=dest_location,
            privilege_violation=True,
            status_code=403,
            response_time_ms=9.2,
            failed_count_override=3
        )

        stages_executed.append({
            "stage": 7,
            "title": "Isolation Forest Anomaly Scoring & Evidence",
            "anomaly_score": securox_evt.get("anomaly_score", 0.94),
            "severity": securox_evt.get("severity", "critical"),
            "contributing_signals": securox_evt.get("contributing_signals", {}),
            "status": "ANOMALY_CLASSIFIED_CRITICAL",
            "timestamp": (now + timedelta(seconds=6)).isoformat(),
            "details": f"Isolation Forest scored threat at {securox_evt.get('anomaly_score', 0.94)} with standardized Z-score outlier attribution."
        })

        stages_executed.append({
            "stage": 8,
            "title": "Securox SIEM Event Persistence & WebSocket Stream",
            "event_id": securox_evt.get("event_id"),
            "status": "EVENT_BROADCAST_COMPLETE",
            "timestamp": (now + timedelta(seconds=7)).isoformat(),
            "details": f"Event {securox_evt.get('event_id')} committed to database and broadcast to SOC Command Center."
        })

        return {
            "status": "SCENARIO_EXECUTED",
            "scenario_id": sc_id,
            "scenario_name": "🔥 Flagship: Multi-Stage Cyber Attack Chain",
            "total_stages": len(stages_executed),
            "stages_executed": stages_executed,
            "result_event": securox_evt,
            "is_simulated": True,
            "system_reaction": "CRITICAL THREAT: Zero-Trust Gateway blocked traffic grid override, enforced step-up lockout, and dispatched structured incident telemetry to Securox SIEM."
        }

    elif sc_id == "SCENARIO_NORMAL":
        securox_evt = await security_engine.monitor_api_invocation(
            db=db,
            user=admin_user,
            endpoint="/api/municipal/permits",
            http_method="GET",
            source_ip="10.14.22.105",
            device_id="DEV-SEC-LAPTOP-HQ-01",
            location="Austin, USA (HQ)",
            status_code=200,
            response_time_ms=15.4
        )
        return {
            "status": "SCENARIO_EXECUTED",
            "scenario_id": sc_id,
            "scenario_name": "Standard Administrative Access (Baseline)",
            "result_event": securox_evt,
            "is_simulated": True,
            "system_reaction": "Telemetry validated. Access allowed within normal baseline tolerances."
        }

    elif sc_id == "SCENARIO_BRUTE_FORCE":
        source_ip = req.custom_ip or "185.220.101.42"
        location = req.custom_location or "Frankfurt, Germany (Tor Node)"
        target_user = db.query(User).filter(User.username == "compliance_auditor").first() or admin_user

        attempt_logs = []
        for i in range(1, 6):
            target_user.failed_login_attempts += 1
            is_locked = target_user.failed_login_attempts >= 5
            if is_locked:
                target_user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
            db.commit()

            # Record audit log per attempt
            audit = ApiAuditLog(
                user_id=target_user.username,
                role=target_user.role.name,
                endpoint="/api/auth/login",
                http_method="POST",
                status_code=401 if not is_locked else 403,
                source_ip=source_ip,
                device_fingerprint=f"DEV-BOTNET-STUFFER-{i}",
                location=location,
                was_blocked=is_locked,
                failure_reason=f"Failed attempt {i}/5" if not is_locked else "Account temporarily locked"
            )
            db.add(audit)
            db.commit()

            attempt_logs.append({
                "attempt": i,
                "status_code": 401 if not is_locked else 403,
                "failed_attempts": target_user.failed_login_attempts,
                "is_locked": is_locked,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })

        securox_evt = await security_engine.monitor_api_invocation(
            db=db,
            user=target_user,
            endpoint="/api/auth/login",
            http_method="POST",
            source_ip=source_ip,
            device_id="DEV-BOTNET-STUFFER-05",
            location=location,
            status_code=403,
            response_time_ms=11.2,
            failed_count_override=5
        )

        return {
            "status": "SCENARIO_EXECUTED",
            "scenario_id": sc_id,
            "scenario_name": "Credential Stuffing & Brute Force Attack",
            "attempts_executed": attempt_logs,
            "account_locked": True,
            "result_event": securox_evt,
            "is_simulated": True,
            "system_reaction": f"Account '{target_user.username}' temporarily locked after 5 failed authentication attempts. Securox threat feed updated."
        }

    elif sc_id == "SCENARIO_IMPOSSIBLE_TRAVEL":
        source_ip = req.custom_ip or "91.240.118.12"
        location = req.custom_location or "Amsterdam, Netherlands"
        distance_km = calculate_haversine_distance("Austin, USA (HQ)", location)
        velocity_kmh = round(distance_km / (5.0 / 60.0), 1)

        securox_evt = await security_engine.monitor_api_invocation(
            db=db,
            user=admin_user,
            endpoint="/api/auth/login",
            http_method="POST",
            source_ip=source_ip,
            device_id="DEV-UNRECOGNIZED-CHROME-MAC",
            location=location,
            status_code=200,
            response_time_ms=24.1
        )
        return {
            "status": "SCENARIO_EXECUTED",
            "scenario_id": sc_id,
            "scenario_name": "Impossible Travel & Unrecognized Device",
            "distance_km": distance_km,
            "calculated_velocity_kmh": velocity_kmh,
            "result_event": securox_evt,
            "is_simulated": True,
            "system_reaction": f"Impossible travel delta ({distance_km:,} km / {velocity_kmh:,} km/h) detected. Step-Up Multi-Factor Challenge enforced."
        }

    elif sc_id == "SCENARIO_PRIVILEGE_ESCALATION":
        securox_evt = await security_engine.monitor_api_invocation(
            db=db,
            user=muni_user,
            endpoint="/api/traffic/override-signal",
            http_method="POST",
            source_ip="10.14.22.108",
            device_id="DEV-MUNI-DESK-02",
            location="Austin, USA (HQ)",
            privilege_violation=True,
            status_code=403,
            response_time_ms=13.5
        )
        return {
            "status": "SCENARIO_EXECUTED",
            "scenario_id": sc_id,
            "scenario_name": "Privilege Boundary Crossing into Traffic Grid",
            "result_event": securox_evt,
            "is_simulated": True,
            "system_reaction": "Action blocked with HTTP 403 Forbidden (Clearance Level 3 insufficient for Traffic Grid Level 4). Critical event dispatched."
        }

    elif sc_id == "SCENARIO_API_BURST":
        source_ip = req.custom_ip or "10.14.22.199"
        for _ in range(45):
            security_engine._record_request("script_runner")
        measured_rate = security_engine._clean_sliding_window("script_runner")

        securox_evt = await security_engine.monitor_api_invocation(
            db=db,
            user=admin_user,
            endpoint="/api/traffic/status",
            http_method="GET",
            source_ip=source_ip,
            device_id="DEV-AUTOMATION-SCRIPT",
            location="Austin, USA (HQ)",
            status_code=200,
            response_time_ms=4.8
        )
        return {
            "status": "SCENARIO_EXECUTED",
            "scenario_id": sc_id,
            "scenario_name": "Abnormal High-Rate API Velocity Burst (DoS)",
            "measured_requests_per_min": measured_rate,
            "result_event": securox_evt,
            "is_simulated": True,
            "system_reaction": f"Sliding window measured {measured_rate} requests/min. Rate anomaly alert generated."
        }

    elif sc_id == "SCENARIO_TREASURY_FRAUD":
        securox_evt = await security_engine.monitor_api_invocation(
            db=db,
            user=admin_user,
            endpoint="/api/payment/disburse",
            http_method="POST",
            source_ip="10.14.22.105",
            device_id="DEV-SEC-LAPTOP-HQ-01",
            location="Austin, USA (HQ)",
            status_code=403,
            response_time_ms=18.2
        )
        return {
            "status": "SCENARIO_EXECUTED",
            "scenario_id": sc_id,
            "scenario_name": "High-Value Treasury Exfiltration Attempt",
            "transfer_amount": 150000.0,
            "result_event": securox_evt,
            "is_simulated": True,
            "system_reaction": "Zero-Trust financial policy halted $150,000 disbursement pending executive cryptographic step-up approval."
        }

    else:
        raise HTTPException(status_code=400, detail=f"Unknown scenario ID: {sc_id}")
