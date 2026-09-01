import json
import time
import uuid
from collections import defaultdict
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import WebSocket
from sqlalchemy.orm import Session

from database import compute_hash
from models import SecurityEvent, ApiAuditLog, User
from ml_engine import anomaly_engine

class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_event(self, event_data: Dict[str, Any]):
        message = json.dumps(event_data)
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                dead_connections.append(connection)
        for dead in dead_connections:
            if dead in self.active_connections:
                self.active_connections.remove(dead)

ws_manager = WebSocketManager()

class SecurityMonitoringEngine:
    def __init__(self):
        self.request_timestamps = defaultdict(list)
        self.unauth_timestamps = defaultdict(list)

    def _clean_sliding_window(self, key: str, window_secs: float = 60.0) -> int:
        now = time.time()
        self.request_timestamps[key] = [t for t in self.request_timestamps[key] if now - t <= window_secs]
        return len(self.request_timestamps[key])

    def _record_request(self, key: str) -> int:
        now = time.time()
        self.request_timestamps[key].append(now)
        return self._clean_sliding_window(key)

    def _record_unauth(self, key: str) -> int:
        now = time.time()
        self.unauth_timestamps[key].append(now)
        self.unauth_timestamps[key] = [t for t in self.unauth_timestamps[key] if now - t <= 300.0]
        return len(self.unauth_timestamps[key])

    def get_endpoint_criticality(self, endpoint: str) -> int:
        if "traffic" in endpoint or "override" in endpoint or "emergency" in endpoint:
            return 4
        elif "payment" in endpoint or "disburse" in endpoint or "treasury" in endpoint:
            return 3
        elif "municipal" in endpoint or "permit" in endpoint or "users" in endpoint:
            return 2
        return 1

    async def monitor_api_invocation(
        self,
        db: Session,
        user: Optional[User],
        endpoint: str,
        http_method: str,
        source_ip: str,
        device_id: str,
        location: str = "Austin, USA (HQ)",
        privilege_violation: bool = False,
        status_code: int = 200,
        response_time_ms: float = 20.0,
        failed_count_override: Optional[int] = None
    ) -> Dict[str, Any]:
        user_key = user.username if user else source_ip
        req_count_1m = self._record_request(user_key)
        
        unauth_count = 0
        if status_code in [401, 403] or privilege_violation:
            unauth_count = self._record_unauth(user_key)

        criticality = self.get_endpoint_criticality(endpoint)

        is_new_device = 1.0 if ("UNRECOGNIZED" in device_id or "EXTERNAL" in device_id or "BOTNET" in device_id or "ADVERSARY" in device_id) else 0.0
        is_new_ip = 0.0 if (source_ip.startswith("10.") or source_ip.startswith("172.") or source_ip.startswith("192.168.")) else 1.0
        
        loc_delta = 0.0
        if "Austin" not in location and "HQ" not in location:
            loc_delta = 7500.0

        failed_logins = float(failed_count_override if failed_count_override is not None else (user.failed_login_attempts if user else (4.0 if status_code == 401 else 0.0)))

        features = {
            "login_freq": 1.0,
            "failed_login_count": failed_logins,
            "new_device": is_new_device,
            "new_ip": is_new_ip,
            "location_delta_km": loc_delta,
            "privilege_shift": 1.0 if privilege_violation else 0.0,
            "api_request_rate": float(req_count_1m),
            "endpoint_criticality": float(criticality),
            "unauthorized_attempts": float(max(unauth_count, 1 if status_code in [401, 403] else 0)),
            "session_duration_mins": 30.0
        }

        eval_result = anomaly_engine.predict_anomaly(features)
        
        if privilege_violation and criticality >= 3:
            eval_result["severity"] = "critical"
            eval_result["anomaly_score"] = max(eval_result["anomaly_score"], 0.94)
            eval_result["evidence"].append("critical_infrastructure_privilege_mismatch")
        elif status_code == 401 and (is_new_device or is_new_ip or failed_logins >= 3):
            eval_result["severity"] = "critical" if failed_logins >= 3 else "high"
            eval_result["anomaly_score"] = max(eval_result["anomaly_score"], 0.88)
            eval_result["evidence"].append("credential_stuffing_or_untrusted_device_auth_failure")
        elif req_count_1m > 30:
            eval_result["severity"] = "critical" if req_count_1m > 50 else "high"
            eval_result["anomaly_score"] = max(eval_result["anomaly_score"], 0.85)
            eval_result["evidence"].append(f"api_rate_burst_velocity_{req_count_1m}_req_min")

        event_record = None
        if eval_result["anomaly_score"] >= 0.35 or privilege_violation or status_code >= 400:
            event_id = f"EVT-{uuid.uuid4().hex[:8].upper()}"
            
            if privilege_violation and "traffic" in endpoint:
                evt_type = "unauthorized_traffic_grid_override_attempt"
            elif privilege_violation:
                evt_type = "unauthorized_privilege_boundary_violation"
            elif req_count_1m > 30:
                evt_type = "abnormal_api_velocity_burst"
            elif status_code == 401:
                evt_type = "suspicious_credential_stuffing_or_brute_force"
            elif is_new_device and loc_delta > 1000:
                evt_type = "suspicious_impossible_travel_invocation"
            elif status_code == 403:
                evt_type = "unauthorized_endpoint_access_denied"
            else:
                evt_type = "elevated_telemetry_anomaly"

            event_record = SecurityEvent(
                event_id=event_id,
                event_type=evt_type,
                user_id=user.username if user else "anonymous",
                role=user.role.name if user and user.role else "UNKNOWN",
                device_id=device_id,
                source_ip=source_ip,
                location=location,
                endpoint=endpoint,
                timestamp=datetime.now(timezone.utc),
                anomaly_score=eval_result["anomaly_score"],
                severity=eval_result["severity"],
                mitigation_action=eval_result["mitigation_action"],
                securox_forwarded=True
            )
            event_record.set_evidence(eval_result["evidence"])
            db.add(event_record)

        # Tamper-Evident Audit Logging
        last_log = db.query(ApiAuditLog).order_by(ApiAuditLog.id.desc()).first()
        prev_hash = last_log.log_hash if last_log and last_log.log_hash else "00000000000000000000000000000000"
        
        log_payload = f"{user.username if user else 'anon'}|{endpoint}|{http_method}|{status_code}|{source_ip}|{time.time()}"
        current_hash = compute_hash(log_payload, prev_hash)

        audit_entry = ApiAuditLog(
            user_id=user.username if user else "anonymous",
            role=user.role.name if user and user.role else "ANONYMOUS",
            endpoint=endpoint,
            http_method=http_method,
            status_code=status_code,
            source_ip=source_ip,
            device_fingerprint=device_id,
            location=location,
            response_time_ms=response_time_ms,
            was_blocked=(status_code >= 400 or privilege_violation),
            failure_reason="Privilege Check Failed" if privilege_violation else (f"HTTP {status_code}" if status_code >= 400 else None),
            log_hash=current_hash
        )
        db.add(audit_entry)
        db.commit()

        securox_payload = {
            "type": "SECUROX_SECURITY_EVENT" if event_record else "SECUROX_AUDIT_LOG",
            "event_id": event_record.event_id if event_record else f"AUD-{uuid.uuid4().hex[:6].upper()}",
            "event_type": event_record.event_type if event_record else "standard_api_access",
            "user_id": user.username if user else "anonymous",
            "role": user.role.name if user and user.role else "ANONYMOUS",
            "device_id": device_id,
            "source_ip": source_ip,
            "location": location,
            "endpoint": endpoint,
            "http_method": http_method,
            "status_code": status_code,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "anomaly_score": eval_result["anomaly_score"],
            "severity": eval_result["severity"],
            "evidence": eval_result["evidence"],
            "mitigation_action": eval_result["mitigation_action"],
            "securox_forwarded": True,
            "contributing_signals": eval_result["contributing_signals"]
        }

        await ws_manager.broadcast_event(securox_payload)

        return securox_payload

security_engine = SecurityMonitoringEngine()

