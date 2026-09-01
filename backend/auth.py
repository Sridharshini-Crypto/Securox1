import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from fastapi import Depends, HTTPException, status, Header, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from config import settings
from database import get_db, compute_hash, verify_password, get_password_hash
from models import User, Role, UserSession, Device, ApiAuditLog, SecurityEvent
from ml_engine import anomaly_engine
from abac_engine import abac_engine, PolicyEvaluationRequest, AbacDecision

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_step_up_token(username: str, session_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.STEP_UP_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": username,
        "session_id": session_id,
        "step_up": True,
        "exp": expire,
        "type": "step_up"
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def assess_login_risk(
    user: User,
    device_fp: str,
    ip_addr: str,
    location_city: str,
    db: Session
) -> Dict[str, Any]:
    # 1. Device check
    known_device = db.query(Device).filter(
        Device.user_id == user.id,
        Device.device_fingerprint == device_fp,
        Device.is_trusted == True
    ).first()
    is_new_device = 1.0 if not known_device else 0.0

    # 2. IP check
    is_new_ip = 0.0 if (ip_addr.startswith("10.") or ip_addr.startswith("172.16.") or ip_addr.startswith("192.168.")) else 1.0

    # 3. Location distance delta
    loc_delta_km = 0.0
    if location_city.lower() not in ["austin", "austin, tx", "austin, usa", "internal-hq"]:
        loc_cities_map = {
            "dallas": 310.0,
            "houston": 260.0,
            "new york": 2800.0,
            "london": 7900.0,
            "amsterdam": 8100.0,
            "moscow": 9600.0,
            "beijing": 11500.0
        }
        loc_delta_km = loc_cities_map.get(location_city.lower(), 5000.0)

    # 4. Failed login history
    failed_count = float(user.failed_login_attempts)

    # 5. ML Feature Vector Feed
    feature_dict = {
        "login_freq": 2.0,
        "failed_login_count": failed_count,
        "new_device": is_new_device,
        "new_ip": is_new_ip,
        "location_delta_km": loc_delta_km,
        "privilege_shift": 0.0,
        "api_request_rate": 2.0,
        "endpoint_criticality": 1.0,
        "unauthorized_attempts": 0.0,
        "session_duration_mins": 0.0
    }

    ml_result = anomaly_engine.predict_anomaly(feature_dict)
    signals = ml_result.get("contributing_signals", ml_result.get("feature_breakdown", {}))

    return {
        "is_new_device": bool(is_new_device),
        "is_new_ip": bool(is_new_ip),
        "location_delta_km": loc_delta_km,
        "anomaly_score": ml_result["anomaly_score"],
        "severity": ml_result["severity"],
        "mitigation_action": ml_result["mitigation_action"],
        "evidence": ml_result["evidence"],
        "contributing_signals": signals,
        "feature_breakdown": signals,
        "requires_step_up": ml_result["anomaly_score"] >= 0.50
    }

def get_current_user_and_session(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> tuple[User, UserSession]:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        session_id: Optional[int] = payload.get("session_id")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None or not user.is_active:
        raise credentials_exception

    # Real Session Revocation Enforcement
    session = None
    if session_id:
        session = db.query(UserSession).filter(UserSession.id == session_id).first()
        if session:
            if session.is_revoked:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Zero-Trust Enforced: Administrative session has been revoked by SOC."
                )
            if session.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Zero-Trust Enforced: Session has expired. Please re-authenticate."
                )
    
    if not session:
        session = db.query(UserSession).filter(
            UserSession.user_id == user.id,
            UserSession.is_revoked == False
        ).order_by(UserSession.id.desc()).first()

    return user, session

def get_current_user(data: tuple[User, UserSession] = Depends(get_current_user_and_session)) -> User:
    return data[0]

def require_permissions(required_permissions: List[str]):
    def permission_checker(data: tuple[User, UserSession] = Depends(get_current_user_and_session), db: Session = Depends(get_db)) -> User:
        user, session = data
        user_perms = user.role.get_permissions() if user.role else []
        
        if "SUPER_ADMIN" == user.role.name:
            return user

        missing = [p for p in required_permissions if p not in user_perms]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Insufficient clearance. Missing permission(s): {', '.join(missing)}"
            )
        return user
    return permission_checker

def enforce_abac_policy(resource: str, action: str, criticality: int = 1):
    def abac_checker(data: tuple[User, UserSession] = Depends(get_current_user_and_session), db: Session = Depends(get_db)) -> tuple[User, UserSession]:
        user, session = data

        decision: AbacDecision = abac_engine.evaluate(PolicyEvaluationRequest(
            user=user,
            session=session,
            resource=resource,
            action=action,
            criticality=criticality
        ))

        if not decision.allowed:
            if decision.requires_step_up:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"ZERO_TRUST_STEP_UP_REQUIRED: {decision.denial_reason}"
                )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"ABAC_DENIED: {decision.denial_reason}"
            )

        return user, session
    return abac_checker

