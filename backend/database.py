import json
import hashlib
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from config import settings
from models import (
    Base, Role, User, Device, UserSession, ApiAuditLog, SecurityEvent,
    MunicipalPermit, PaymentTransaction, TrafficSignal
)

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def compute_hash(data_str: str, prev_hash: str = "") -> str:
    return hashlib.sha256(f"{prev_hash}|{data_str}".encode('utf-8')).hexdigest()

def seed_initial_data(db: Session):
    if db.query(Role).first():
        return # Database already seeded

    print(">>> Seeding Securox Zero-Trust Government Database...")

    # 1. Seed Roles
    roles = {
        "SUPER_ADMIN": Role(
            name="SUPER_ADMIN",
            description="Homeland Security & Infrastructure Oversight - Full System Clearance",
            permissions_json=json.dumps([
                "AUTH_ADMIN", "USER_ADMIN", "MUNICIPAL_ALL", "PAYMENT_ALL",
                "TRAFFIC_OVERRIDE", "SECURITY_SOC_READ", "SECURITY_SOC_WRITE",
                "STEP_UP_BYPASS", "AUDIT_EXPORT"
            ])
        ),
        "MUNICIPAL_DIRECTOR": Role(
            name="MUNICIPAL_DIRECTOR",
            description="Municipal Services & Urban Development",
            permissions_json=json.dumps([
                "MUNICIPAL_READ", "MUNICIPAL_WRITE", "MUNICIPAL_APPROVE", "PAYMENT_READ"
            ])
        ),
        "TRAFFIC_CONTROLLER": Role(
            name="TRAFFIC_CONTROLLER",
            description="Smart City Transit Authority & Emergency Routing",
            permissions_json=json.dumps([
                "TRAFFIC_READ", "TRAFFIC_OVERRIDE", "TRAFFIC_EMERGENCY_WAVE"
            ])
        ),
        "FINANCE_OFFICER": Role(
            name="FINANCE_OFFICER",
            description="Municipal Treasury & Government Disbursements",
            permissions_json=json.dumps([
                "PAYMENT_READ", "PAYMENT_DISBURSE", "PAYMENT_APPROVE"
            ])
        ),
        "AUDITOR": Role(
            name="AUDITOR",
            description="Inspector General & Security Compliance (Read-Only)",
            permissions_json=json.dumps([
                "SECURITY_SOC_READ", "AUDIT_EXPORT", "MUNICIPAL_READ",
                "PAYMENT_READ", "TRAFFIC_READ"
            ])
        )
    }

    for r in roles.values():
        db.add(r)
    db.commit()

    # 2. Seed Users
    default_pw = get_password_hash("Securox@Gov2026!")

    users = [
        User(
            username="admin01",
            email="sarah.connor@homeland.gov",
            hashed_password=default_pw,
            full_name="Sarah Connor",
            department="Homeland & Infrastructure Security",
            role_id=roles["SUPER_ADMIN"].id,
            security_clearance_level=5,
            passkey_registered=True,
            biometric_registered=True
        ),
        User(
            username="muni_lead",
            email="marcus.vance@austin.gov",
            hashed_password=default_pw,
            full_name="Marcus Vance",
            department="Municipal Urban Development",
            role_id=roles["MUNICIPAL_DIRECTOR"].id,
            security_clearance_level=3,
            passkey_registered=True,
            biometric_registered=False
        ),
        User(
            username="traffic_ops",
            email="elena.rostova@transit.austin.gov",
            hashed_password=default_pw,
            full_name="Elena Rostova",
            department="Smart City Transit Authority",
            role_id=roles["TRAFFIC_CONTROLLER"].id,
            security_clearance_level=4,
            passkey_registered=True,
            biometric_registered=True
        ),
        User(
            username="treasury_lead",
            email="richard.hendricks@treasury.austin.gov",
            hashed_password=default_pw,
            full_name="Richard Hendricks",
            department="Municipal Treasury & Payouts",
            role_id=roles["FINANCE_OFFICER"].id,
            security_clearance_level=4,
            passkey_registered=True,
            biometric_registered=True
        ),
        User(
            username="compliance_auditor",
            email="diane.lockhart@oig.gov",
            hashed_password=default_pw,
            full_name="Diane Lockhart",
            department="Office of Inspector General",
            role_id=roles["AUDITOR"].id,
            security_clearance_level=2,
            passkey_registered=False,
            biometric_registered=False
        )
    ]

    for u in users:
        db.add(u)
    db.commit()

    # 3. Seed Trusted Hardware Devices
    devices = [
        Device(
            user_id=users[0].id,
            device_fingerprint="DEV-SEC-LAPTOP-HQ-01",
            device_name="Gov-Issued ThinkPad T14s (Austin HQ)",
            os="Windows 11 Enterprise",
            browser="Chrome 122 Secure",
            is_trusted=True
        ),
        Device(
            user_id=users[2].id,
            device_fingerprint="DEV-TRAFFIC-WORKSTATION-01",
            device_name="TOC Operations Console 04",
            os="Ubuntu 22.04 LTS",
            browser="Firefox ESR",
            is_trusted=True
        ),
        Device(
            user_id=users[3].id,
            device_fingerprint="DEV-FINANCE-HQ",
            device_name="Treasury Secured Workstation 02",
            os="Windows 11 Enterprise",
            browser="Edge Secured",
            is_trusted=True
        )
    ]
    for d in devices:
        db.add(d)

    # 4. Seed Municipal Infrastructure Permits
    permits = [
        MunicipalPermit(
            permit_number="PRM-2026-8812",
            applicant_name="Apex Construction & Civil",
            permit_type="Commercial High-Rise Foundation",
            status="APPROVED",
            fee_amount=14500.0,
            zone_code="ZONE-CBD-04",
            issued_by="Marcus Vance"
        ),
        MunicipalPermit(
            permit_number="PRM-2026-8815",
            applicant_name="NextGen Telecom Infrastructure",
            permit_type="5G Fiber Trenching Subsurface",
            status="PENDING",
            fee_amount=6200.0,
            zone_code="ZONE-METRO-02",
            issued_by="Marcus Vance"
        ),
        MunicipalPermit(
            permit_number="PRM-2026-8819",
            applicant_name="Austin Clean Waterworks",
            permit_type="Main Aqueduct Valve Replacement",
            status="APPROVED",
            fee_amount=28900.0,
            zone_code="ZONE-WATER-01",
            issued_by="Marcus Vance"
        )
    ]
    for p in permits:
        db.add(p)

    # 5. Seed Municipal Treasury Transactions
    txs = [
        PaymentTransaction(
            transaction_id="TX-GOV-2026-0041",
            recipient="Austin Metro Transit Authority",
            department="Transportation",
            amount=450000.0,
            purpose="Monthly Clean Bus Fleet Maintenance",
            approval_status="APPROVED",
            risk_level="LOW",
            requires_step_up=False,
            approved_by="Richard Hendricks"
        ),
        PaymentTransaction(
            transaction_id="TX-GOV-2026-0048",
            recipient="Global Cyber Defense Corp",
            department="Homeland Security",
            amount=128000.0,
            purpose="Zero-Trust Perimeter Infrastructure Upgrade",
            approval_status="APPROVED",
            risk_level="MEDIUM",
            requires_step_up=True,
            approved_by="Richard Hendricks"
        ),
        PaymentTransaction(
            transaction_id="TX-GOV-2026-0052",
            recipient="Vertex Energy Grid Solutions",
            department="Public Utilities",
            amount=85000.0,
            purpose="Smart Grid Substation Telemetry",
            approval_status="PENDING_STEP_UP",
            risk_level="HIGH",
            requires_step_up=True,
            approved_by="Richard Hendricks"
        )
    ]
    for t in txs:
        db.add(t)

    # 6. Seed Smart City Traffic Intersections
    signals = [
        TrafficSignal(
            intersection_code="INT-001",
            name="Congress Ave & 6th St",
            district="Downtown Core",
            current_state="GREEN_NORTH_SOUTH",
            congestion_level=45,
            automated_mode=True,
            emergency_corridor_active=False
        ),
        TrafficSignal(
            intersection_code="INT-002",
            name="Lavaca St & 11th St (Capitol East)",
            district="Capitol District",
            current_state="GREEN_EAST_WEST",
            congestion_level=65,
            automated_mode=True,
            emergency_corridor_active=False
        ),
        TrafficSignal(
            intersection_code="INT-003",
            name="Red River St & MLK Blvd (Hospital Corridor)",
            district="Healthcare District",
            current_state="GREEN_NORTH_SOUTH",
            congestion_level=30,
            automated_mode=True,
            emergency_corridor_active=False
        ),
        TrafficSignal(
            intersection_code="INT-004",
            name="Riverside Dr & S Lamar Blvd",
            district="South River District",
            current_state="ALL_RED",
            congestion_level=80,
            automated_mode=False,
            emergency_corridor_active=False
        )
    ]
    for s in signals:
        db.add(s)

    # 7. Seed Baseline Security Events for Securox Stream
    baseline_events = [
        SecurityEvent(
            event_id="EVT-INIT-001",
            event_type="suspicious_failed_logon_burst",
            user_id="anonymous_external",
            role="UNKNOWN",
            device_id="DEV-UNKNOWN-EXT-TOR-01",
            source_ip="185.220.101.5",
            location="Frankfurt, DE",
            endpoint="/api/auth/login",
            anomaly_score=0.88,
            severity="critical",
            evidence_json=json.dumps([
                "unrecognized_external_ip_origin",
                "repeated_authentication_failures_count_5",
                "new_untrusted_device_fingerprint"
            ]),
            mitigation_action="IP_TEMPORARY_BLOCK",
            securox_forwarded=True
        ),
        SecurityEvent(
            event_id="EVT-INIT-002",
            event_type="suspicious_impossible_travel_invocation",
            user_id="muni_lead",
            role="MUNICIPAL_DIRECTOR",
            device_id="DEV-UNRECOGNIZED-CHROME",
            source_ip="91.240.118.12",
            location="Amsterdam, NL",
            endpoint="/api/municipal/permits",
            anomaly_score=0.74,
            severity="high",
            evidence_json=json.dumps([
                "impossible_travel_delta_8100km",
                "new_untrusted_device_fingerprint"
            ]),
            mitigation_action="STEP_UP_CHALLENGE_ENFORCED",
            securox_forwarded=True
        )
    ]
    for e in baseline_events:
        db.add(e)

    db.commit()
    print(">>> Database seeded successfully with Roles, Users, Devices, Permits, Payments & Signals.")

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()

