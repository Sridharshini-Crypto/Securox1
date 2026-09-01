import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import MunicipalPermit, User, UserSession
from auth import get_current_user, require_permissions, enforce_abac_policy
from security_engine import security_engine

router = APIRouter(prefix="/municipal", tags=["Municipal Services & Permits"])

class PermitCreateRequest(BaseModel):
    applicant_name: str
    permit_type: str
    fee_amount: float
    zone_code: str

class PermitStatusUpdateRequest(BaseModel):
    permit_id: int
    status: str # APPROVED, REJECTED, REVOKED
    reason: Optional[str] = "Municipal zoning clearance verification"

class EmergencyBroadcastRequest(BaseModel):
    broadcast_title: str
    affected_zones: List[str]
    severity_level: str
    message_body: str

@router.get("/permits")
async def list_permits(
    auth_data: tuple[User, UserSession] = Depends(enforce_abac_policy("MUNICIPAL_PERMITS", "READ", 1)),
    db: Session = Depends(get_db)
):
    permits = db.query(MunicipalPermit).order_by(MunicipalPermit.id.desc()).all()
    return {
        "permits": [
            {
                "id": p.id,
                "permit_number": p.permit_number,
                "applicant_name": p.applicant_name,
                "permit_type": p.permit_type,
                "status": p.status,
                "fee_amount": p.fee_amount,
                "zone_code": p.zone_code,
                "issued_by": p.issued_by,
                "issued_at": p.issued_at.isoformat()
            } for p in permits
        ],
        "stats": {
            "total": len(permits),
            "approved": len([p for p in permits if p.status == "APPROVED"]),
            "pending": len([p for p in permits if p.status == "PENDING"]),
            "revoked": len([p for p in permits if p.status == "REVOKED"])
        }
    }

@router.post("/permits")
async def create_permit(
    req: PermitCreateRequest,
    auth_data: tuple[User, UserSession] = Depends(enforce_abac_policy("MUNICIPAL_PERMITS", "WRITE", 2)),
    db: Session = Depends(get_db)
):
    current_user, session = auth_data

    permit_num = f"PRM-2026-{uuid.uuid4().hex[:4].upper()}"
    new_permit = MunicipalPermit(
        permit_number=permit_num,
        applicant_name=req.applicant_name,
        permit_type=req.permit_type,
        status="PENDING",
        fee_amount=req.fee_amount,
        zone_code=req.zone_code,
        issued_by=current_user.full_name
    )
    db.add(new_permit)
    db.commit()

    source_ip = session.ip_address if session else "10.14.22.108"
    device_id = session.device_fingerprint if session else "DEV-MUNI-DESK"
    location = f"{session.location_city}, {session.location_country}" if session else "Austin, USA (HQ)"

    await security_engine.monitor_api_invocation(
        db=db,
        user=current_user,
        endpoint="/api/municipal/permits",
        http_method="POST",
        source_ip=source_ip,
        device_id=device_id,
        location=location,
        status_code=200
    )

    return {
        "status": "CREATED",
        "permit": {
            "id": new_permit.id,
            "permit_number": new_permit.permit_number,
            "applicant_name": new_permit.applicant_name,
            "permit_type": new_permit.permit_type,
            "status": new_permit.status,
            "fee_amount": new_permit.fee_amount,
            "zone_code": new_permit.zone_code
        }
    }

@router.post("/permits/update-status")
async def update_permit_status(
    req: PermitStatusUpdateRequest,
    auth_data: tuple[User, UserSession] = Depends(enforce_abac_policy("MUNICIPAL_PERMITS", "WRITE", 2)),
    db: Session = Depends(get_db)
):
    permit = db.query(MunicipalPermit).filter(MunicipalPermit.id == req.permit_id).first()
    if not permit:
        raise HTTPException(status_code=404, detail="Permit record not found")

    permit.status = req.status
    db.commit()

    return {
        "status": "UPDATED",
        "permit_id": permit.id,
        "permit_number": permit.permit_number,
        "new_status": permit.status,
        "reason": req.reason
    }

@router.post("/emergency-broadcast")
async def send_emergency_broadcast(
    req: EmergencyBroadcastRequest,
    auth_data: tuple[User, UserSession] = Depends(enforce_abac_policy("MUNICIPAL_PERMITS", "EMERGENCY_BROADCAST", 3)),
    db: Session = Depends(get_db)
):
    current_user, session = auth_data

    source_ip = session.ip_address if session else "10.14.22.108"
    device_id = session.device_fingerprint if session else "DEV-MUNI-DESK"
    location = f"{session.location_city}, {session.location_country}" if session else "Austin, USA (HQ)"

    await security_engine.monitor_api_invocation(
        db=db,
        user=current_user,
        endpoint="/api/municipal/emergency-broadcast",
        http_method="POST",
        source_ip=source_ip,
        device_id=device_id,
        location=location,
        status_code=200
    )

    return {
        "broadcast_id": f"BC-{uuid.uuid4().hex[:6].upper()}",
        "status": "DISPATCHED_TO_CITY_GRID",
        "title": req.broadcast_title,
        "affected_zones": req.affected_zones,
        "severity": req.severity_level,
        "message": req.message_body,
        "authorizing_officer": current_user.full_name
    }

