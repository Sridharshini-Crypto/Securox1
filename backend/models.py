import json
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False) # e.g. SUPER_ADMIN, MUNICIPAL_DIRECTOR
    description = Column(String(255), nullable=True)
    permissions_json = Column(Text, nullable=False, default="[]")

    users = relationship("User", back_populates="role")

    def get_permissions(self):
        try:
            return json.loads(self.permissions_json)
        except Exception:
            return []

    def set_permissions(self, perms_list):
        self.permissions_json = json.dumps(perms_list)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False) # e.g. "Homeland Security", "Transportation"
    
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    security_clearance_level = Column(Integer, default=1) # 1 to 5
    
    is_active = Column(Boolean, default=True)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Multi-factor hardware / biometric attributes
    passkey_registered = Column(Boolean, default=False)
    biometric_registered = Column(Boolean, default=False)

    role = relationship("Role", back_populates="users")
    sessions = relationship("UserSession", back_populates="user")
    devices = relationship("Device", back_populates="user")

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    device_fingerprint = Column(String(255), index=True, nullable=False)
    device_name = Column(String(100), nullable=False) # e.g. "Workstation-Gov-HQ-402"
    os = Column(String(50), nullable=True)
    browser = Column(String(50), nullable=True)
    is_trusted = Column(Boolean, default=True)
    last_seen = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="devices")

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_token = Column(String(255), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    device_fingerprint = Column(String(255), nullable=False)
    ip_address = Column(String(50), nullable=False)
    location_city = Column(String(100), nullable=True)
    location_country = Column(String(100), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, default=False)
    
    # Zero-Trust telemetry tags
    risk_score = Column(Float, default=0.0) # 0.0 to 1.0
    step_up_verified = Column(Boolean, default=False)
    step_up_verified_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="sessions")

class ApiAuditLog(Base):
    __tablename__ = "api_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(50), index=True, nullable=True) # username or 'anonymous'
    role = Column(String(50), nullable=True)
    endpoint = Column(String(255), index=True, nullable=False)
    http_method = Column(String(10), nullable=False)
    status_code = Column(Integer, nullable=False)
    source_ip = Column(String(50), nullable=False)
    device_fingerprint = Column(String(255), nullable=True)
    location = Column(String(100), nullable=True)
    
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    response_time_ms = Column(Float, default=0.0)
    was_blocked = Column(Boolean, default=False)
    failure_reason = Column(String(255), nullable=True)
    
    # Tamper-evident hash chaining
    log_hash = Column(String(64), nullable=True)

class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(50), unique=True, index=True, nullable=False)
    event_type = Column(String(100), index=True, nullable=False) # e.g. "suspicious_login", "privilege_violation"
    user_id = Column(String(50), index=True, nullable=False)
    role = Column(String(50), nullable=True)
    device_id = Column(String(255), nullable=True)
    source_ip = Column(String(50), nullable=False)
    location = Column(String(100), nullable=True)
    endpoint = Column(String(255), nullable=True)
    
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    anomaly_score = Column(Float, nullable=False) # Normalized 0.0 to 1.0
    severity = Column(String(20), nullable=False) # normal, elevated, high, critical
    
    evidence_json = Column(Text, nullable=False, default="[]")
    mitigation_action = Column(String(100), nullable=True)
    securox_forwarded = Column(Boolean, default=True)

    def get_evidence(self):
        try:
            return json.loads(self.evidence_json)
        except Exception:
            return []

    def set_evidence(self, evidence_list):
        self.evidence_json = json.dumps(evidence_list)

class MunicipalPermit(Base):
    __tablename__ = "municipal_permits"

    id = Column(Integer, primary_key=True, index=True)
    permit_number = Column(String(50), unique=True, index=True, nullable=False)
    applicant_name = Column(String(100), nullable=False)
    permit_type = Column(String(100), nullable=False) # e.g. "Commercial Construction", "Water Infrastructure"
    status = Column(String(50), default="PENDING") # PENDING, APPROVED, REJECTED, REVOKED
    fee_amount = Column(Float, default=0.0)
    zone_code = Column(String(50), nullable=False)
    issued_by = Column(String(100), nullable=True)
    issued_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(50), unique=True, index=True, nullable=False)
    recipient = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    purpose = Column(String(255), nullable=False)
    approval_status = Column(String(50), default="PENDING") # PENDING, APPROVED, REJECTED, PENDING_STEP_UP
    risk_level = Column(String(20), default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    requires_step_up = Column(Boolean, default=False)
    approved_by = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class TrafficSignal(Base):
    __tablename__ = "traffic_signals"

    id = Column(Integer, primary_key=True, index=True)
    intersection_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False) # e.g. "Main St & Capitol Ave"
    district = Column(String(100), nullable=False) # "Downtown Core"
    current_state = Column(String(50), default="GREEN_NORTH_SOUTH")
    congestion_level = Column(Integer, default=25) # 0 to 100%
    automated_mode = Column(Boolean, default=True)
    emergency_corridor_active = Column(Boolean, default=False)
    last_override_by = Column(String(100), nullable=True)
    last_override_time = Column(DateTime, nullable=True)

