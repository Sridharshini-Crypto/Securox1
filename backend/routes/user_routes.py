from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import User, Role, Device, UserSession
from auth import get_current_user, require_permissions, enforce_abac_policy
from security_engine import security_engine

router = APIRouter(prefix="/users", tags=["Government Identity & RBAC/ABAC"])

class RoleChangeRequest(BaseModel):
    user_id: int
    new_role_name: str
    justification: Optional[str] = "Standard administrative reorganization"

class CredentialUpdateRequest(BaseModel):
    user_id: int
    passkey_registered: Optional[bool] = None
    biometric_registered: Optional[bool] = None
    clearance_level: Optional[int] = None

@router.get("")
async def list_users(
    auth_data: tuple[User, UserSession] = Depends(enforce_abac_policy("USER_ROLES", "READ", 1)),
    db: Session = Depends(get_db)
):
    users = db.query(User).all()
    roles = db.query(Role).all()
    
    return {
        "users": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "full_name": u.full_name,
                "department": u.department,
                "role": u.role.name if u.role else "NONE",
                "permissions": u.role.get_permissions() if u.role else [],
                "security_clearance_level": u.security_clearance_level,
                "passkey_registered": u.passkey_registered,
                "biometric_registered": u.biometric_registered,
                "is_active": u.is_active,
                "device_count": len(u.devices),
                "created_at": u.created_at.isoformat()
            } for u in users
        ],
        "available_roles": [
            {
                "id": r.id,
                "name": r.name,
                "description": r.description,
                "permissions": r.get_permissions()
            } for r in roles
        ]
    }

@router.post("/assign-role")
async def assign_user_role(
    req: RoleChangeRequest,
    auth_data: tuple[User, UserSession] = Depends(enforce_abac_policy("USER_ROLES", "ASSIGN_ROLE", 5)),
    db: Session = Depends(get_db)
):
    current_user, session = auth_data

    target_user = db.query(User).filter(User.id == req.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    new_role = db.query(Role).filter(Role.name == req.new_role_name).first()
    if not new_role:
        raise HTTPException(status_code=400, detail=f"Role '{req.new_role_name}' does not exist")

    old_role_name = target_user.role.name if target_user.role else "NONE"
    target_user.role_id = new_role.id
    db.commit()

    source_ip = session.ip_address if session else "10.14.22.105"
    device_id = session.device_fingerprint if session else "DEV-ADMIN-WORKSTATION"
    location = f"{session.location_city}, {session.location_country}" if session else "Austin, USA (HQ)"

    await security_engine.monitor_api_invocation(
        db=db,
        user=current_user,
        endpoint="/api/users/assign-role",
        http_method="POST",
        source_ip=source_ip,
        device_id=device_id,
        location=location,
        privilege_violation=(new_role.name == "SUPER_ADMIN" and current_user.role.name != "SUPER_ADMIN"),
        status_code=200
    )

    return {
        "status": "ROLE_UPDATED",
        "user_id": target_user.id,
        "username": target_user.username,
        "previous_role": old_role_name,
        "new_role": new_role.name,
        "justification": req.justification,
        "message": f"Privilege level modified for {target_user.username} from {old_role_name} to {new_role.name}"
    }

@router.post("/update-credentials")
async def update_credentials(
    req: CredentialUpdateRequest,
    auth_data: tuple[User, UserSession] = Depends(enforce_abac_policy("USER_ROLES", "WRITE", 3)),
    db: Session = Depends(get_db)
):
    target_user = db.query(User).filter(User.id == req.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.passkey_registered is not None:
        target_user.passkey_registered = req.passkey_registered
    if req.biometric_registered is not None:
        target_user.biometric_registered = req.biometric_registered
    if req.clearance_level is not None:
        target_user.security_clearance_level = req.clearance_level

    db.commit()
    return {
        "status": "CREDENTIALS_UPDATED",
        "username": target_user.username,
        "passkey_registered": target_user.passkey_registered,
        "biometric_registered": target_user.biometric_registered,
        "clearance_level": target_user.security_clearance_level
    }

