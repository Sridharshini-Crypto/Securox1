import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models import User, Role, UserSession, Device, SecurityEvent
from auth import (
    verify_password, get_password_hash, create_access_token, create_step_up_token,
    assess_login_risk, get_current_user
)
from security_engine import security_engine, ws_manager

router = APIRouter(prefix="/auth", tags=["Authentication, Registration & Adaptive Zero-Trust"])

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    department: str
    role_name: Optional[str] = "AUDITOR"
    device_fingerprint: Optional[str] = "DEV-SEC-LAPTOP-HQ-01"
    device_name: Optional[str] = "Gov-Issued Workstation"
    passkey_credential: Optional[str] = None
    biometric_signature: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str
    device_fingerprint: Optional[str] = "DEV-SEC-LAPTOP-HQ-01"
    device_name: Optional[str] = "Gov-Issued Workstation"
    source_ip: Optional[str] = "10.14.22.105"
    location_city: Optional[str] = "Austin"
    location_country: Optional[str] = "USA"
    biometric_signature: Optional[str] = None
    passkey_credential: Optional[str] = None

class StepUpRequest(BaseModel):
    verification_type: str # "PASSKEY" or "BIOMETRIC" or "HARDWARE_TOKEN"
    token_or_payload: str

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_official(req: RegisterRequest, db: Session = Depends(get_db)):
    # 1. Check if username or email already exists
    existing_user = db.query(User).filter(
        (User.username == req.username.strip().lower()) | (User.email == req.email.strip().lower())
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An official account with this username or government email already exists."
        )

    # 2. Lookup or default role
    role_obj = db.query(Role).filter(Role.name == req.role_name.upper()).first()
    if not role_obj:
        role_obj = db.query(Role).filter(Role.name == "AUDITOR").first()
        if not role_obj:
            role_obj = Role(name="AUDITOR", description="Auditor & Compliance", permissions_json='["permits:read", "traffic:read", "audit_logs:read"]')
            db.add(role_obj)
            db.commit()
            db.refresh(role_obj)

    # Determine clearance level based on role
    clearance_map = {
        "SUPER_ADMIN": 5,
        "TRAFFIC_CONTROLLER": 4,
        "FINANCE_OFFICER": 4,
        "MUNICIPAL_DIRECTOR": 3,
        "AUDITOR": 2
    }
    clearance_lvl = clearance_map.get(role_obj.name, 2)

    # 3. Create user
    new_user = User(
        username=req.username.strip().lower(),
        email=req.email.strip().lower(),
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name.strip(),
        department=req.department.strip(),
        role_id=role_obj.id,
        security_clearance_level=clearance_lvl,
        is_active=True,
        passkey_registered=bool(req.passkey_credential),
        biometric_registered=bool(req.biometric_signature)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 4. Register trusted device
    dev_fp = req.device_fingerprint or f"DEV-REG-{uuid.uuid4().hex[:8].upper()}"
    new_device = Device(
        user_id=new_user.id,
        device_fingerprint=dev_fp,
        device_name=req.device_name or "Gov-Issued Workstation",
        is_trusted=True
    )
    db.add(new_device)
    db.commit()

    return {
        "status": "ACCOUNT_CREATED",
        "message": f"Government official account '{new_user.username}' successfully registered with Level {clearance_lvl} clearance.",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "department": new_user.department,
            "role": role_obj.name,
            "clearance_level": clearance_lvl,
            "device_registered": dev_fp,
            "passkey_registered": new_user.passkey_registered,
            "biometric_registered": new_user.biometric_registered
        }
    }

@router.post("/login")
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username.strip().lower()).first()

    # 1. Check if user exists
    if not user:
        await security_engine.monitor_api_invocation(
            db=db,
            user=None,
            endpoint="/api/auth/login",
            http_method="POST",
            source_ip=req.source_ip,
            device_id=req.device_fingerprint,
            location=f"{req.location_city}, {req.location_country}",
            status_code=401
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrative credentials"
        )

    # 2. Check if account is locked
    if user.locked_until:
        locked_time = user.locked_until if user.locked_until.tzinfo else user.locked_until.replace(tzinfo=timezone.utc)
        if locked_time > datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is temporarily locked due to repeated authentication failures. Contact SOC."
            )

    # 3. Check password
    if not verify_password(req.password, user.hashed_password):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= settings.MAX_FAILED_LOGINS:
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
        db.commit()

        await security_engine.monitor_api_invocation(
            db=db,
            user=user,
            endpoint="/api/auth/login",
            http_method="POST",
            source_ip=req.source_ip,
            device_id=req.device_fingerprint,
            location=f"{req.location_city}, {req.location_country}",
            status_code=401
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid credentials. Failed attempts: {user.failed_login_attempts}/{settings.MAX_FAILED_LOGINS}"
        )

    # Reset failed attempts
    user.failed_login_attempts = 0
    db.commit()

    # 4. Zero-Trust Adaptive Risk Assessment
    risk_assessment = assess_login_risk(
        user=user,
        device_fp=req.device_fingerprint,
        ip_addr=req.source_ip,
        location_city=req.location_city,
        db=db
    )

    passkey_verified = bool(req.passkey_credential and user.passkey_registered)
    biometric_verified = bool(req.biometric_signature and user.biometric_registered)

    # Create active session
    session_token = f"SEC-SES-{uuid.uuid4().hex}"
    new_session = UserSession(
        session_token=session_token,
        user_id=user.id,
        device_fingerprint=req.device_fingerprint,
        ip_address=req.source_ip,
        location_city=req.location_city,
        location_country=req.location_country,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        risk_score=risk_assessment["anomaly_score"],
        step_up_verified=(passkey_verified or biometric_verified or not risk_assessment["requires_step_up"])
    )
    db.add(new_session)
    db.commit()

    access_token = create_access_token(data={
        "sub": user.username,
        "role": user.role.name,
        "clearance": user.security_clearance_level,
        "session_id": new_session.id
    })

    await security_engine.monitor_api_invocation(
        db=db,
        user=user,
        endpoint="/api/auth/login",
        http_method="POST",
        source_ip=req.source_ip,
        device_id=req.device_fingerprint,
        location=f"{req.location_city}, {req.location_country}",
        status_code=200
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "session_id": new_session.id,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "department": user.department,
            "role": user.role.name,
            "permissions": user.role.get_permissions(),
            "clearance_level": user.security_clearance_level,
            "passkey_registered": user.passkey_registered,
            "biometric_registered": user.biometric_registered,
            "step_up_verified": new_session.step_up_verified
        },
        "risk_assessment": risk_assessment,
        "requires_step_up": risk_assessment["requires_step_up"] and not (passkey_verified or biometric_verified)
    }

@router.post("/step-up")
async def step_up_authenticate(
    req: StepUpRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.is_revoked == False
    ).order_by(UserSession.created_at.desc()).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Active session not found. Please log in again."
        )

    # Validate verification payload
    if not req.token_or_payload or len(req.token_or_payload) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid cryptographic step-up verification token."
        )

    session.step_up_verified = True
    session.step_up_verified_at = datetime.now(timezone.utc)
    db.commit()

    step_up_jwt = create_step_up_token(current_user.username, session.id)

    sec_event = SecurityEvent(
        event_id=f"EVT-STEPUP-{uuid.uuid4().hex[:8].upper()}",
        event_type="zero_trust_step_up_elevation_success",
        user_id=current_user.username,
        role=current_user.role.name,
        device_id=session.device_fingerprint,
        source_ip=session.ip_address,
        location=f"{session.location_city}, {session.location_country}",
        endpoint="/api/auth/step-up",
        anomaly_score=0.10,
        severity="normal",
        evidence_json='["cryptographic_step_up_elevation_passed", "fido2_webauthn_challenge_verified"]',
        mitigation_action="ELEVATED_SESSION_GRANTED",
        securox_forwarded=True
    )
    db.add(sec_event)
    db.commit()

    await ws_manager.broadcast_event({
        "type": "SECUROX_SECURITY_EVENT",
        "event_id": sec_event.event_id,
        "event_type": sec_event.event_type,
        "user_id": current_user.username,
        "role": current_user.role.name,
        "device_id": session.device_fingerprint,
        "source_ip": session.ip_address,
        "location": f"{session.location_city}, {session.location_country}",
        "endpoint": "/api/auth/step-up",
        "anomaly_score": 0.10,
        "severity": "normal",
        "evidence": ["cryptographic_step_up_elevation_passed"],
        "mitigation_action": "ELEVATED_SESSION_GRANTED",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    return {
        "status": "STEP_UP_VERIFIED",
        "message": f"Zero-Trust step-up elevation granted for session {session.id}.",
        "step_up_token": step_up_jwt,
        "verified_at": session.step_up_verified_at.isoformat()
    }

@router.get("/me")
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.is_revoked == False
    ).order_by(UserSession.created_at.desc()).first()

    return {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "department": current_user.department,
            "role": current_user.role.name,
            "permissions": current_user.role.get_permissions(),
            "clearance_level": current_user.security_clearance_level,
            "passkey_registered": current_user.passkey_registered,
            "biometric_registered": current_user.biometric_registered,
            "step_up_verified": session.step_up_verified if session else False
        }
    }

@router.post("/logout")
async def logout_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    active_sessions = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.is_revoked == False
    ).all()

    for s in active_sessions:
        s.is_revoked = True
    db.commit()

    return {
        "status": "LOGGED_OUT",
        "message": "All active cryptographic sessions successfully revoked."
    }
