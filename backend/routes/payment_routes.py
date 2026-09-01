import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import PaymentTransaction, User, UserSession
from auth import get_current_user, require_permissions, enforce_abac_policy, get_current_user_and_session
from security_engine import security_engine
from abac_engine import abac_engine, PolicyEvaluationRequest

router = APIRouter(prefix="/payment", tags=["Municipal Treasury & Financial Processing"])

class DisbursementRequest(BaseModel):
    recipient: str
    department: str
    amount: float
    purpose: str

class ApprovalRequest(BaseModel):
    transaction_id: str
    action: str # "APPROVE" or "REJECT" or "FLAG_SOC"
    notes: Optional[str] = "Standard compliance review"

@router.get("/transactions")
async def list_transactions(
    auth_data: tuple[User, UserSession] = Depends(enforce_abac_policy("TREASURY_PAYMENT", "READ", 1)),
    db: Session = Depends(get_db)
):
    txs = db.query(PaymentTransaction).order_by(PaymentTransaction.id.desc()).all()
    total_disbursed = sum(t.amount for t in txs if t.approval_status == "APPROVED")
    pending_count = len([t for t in txs if t.approval_status == "PENDING_STEP_UP"])
    
    return {
        "treasury_overview": {
            "total_budget": 50000000.0,
            "disbursed_year_to_date": total_disbursed,
            "remaining_reserves": 50000000.0 - total_disbursed,
            "pending_high_risk_approvals": pending_count
        },
        "transactions": [
            {
                "id": t.id,
                "transaction_id": t.transaction_id,
                "recipient": t.recipient,
                "department": t.department,
                "amount": t.amount,
                "purpose": t.purpose,
                "approval_status": t.approval_status,
                "risk_level": t.risk_level,
                "requires_step_up": t.requires_step_up,
                "approved_by": t.approved_by,
                "timestamp": t.timestamp.isoformat()
            } for t in txs
        ]
    }

@router.post("/disburse")
async def initiate_disbursement(
    req: DisbursementRequest,
    auth_data: tuple[User, UserSession] = Depends(get_current_user_and_session),
    db: Session = Depends(get_db)
):
    current_user, session = auth_data

    decision = abac_engine.evaluate(PolicyEvaluationRequest(
        user=current_user,
        session=session,
        resource="TREASURY_PAYMENT",
        action="DISBURSE_FUNDS",
        criticality=3,
        amount=req.amount
    ))

    if not decision.allowed and not decision.requires_step_up:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"ABAC_DENIED: {decision.denial_reason}"
        )

    tx_id = f"TX-GOV-2026-{uuid.uuid4().hex[:4].upper()}"
    requires_step_up = decision.requires_step_up or req.amount >= 50000.0
    risk_level = "HIGH" if req.amount >= 200000.0 else ("MEDIUM" if req.amount >= 50000.0 else "LOW")
    approval_status = "PENDING_STEP_UP" if requires_step_up else "APPROVED"

    new_tx = PaymentTransaction(
        transaction_id=tx_id,
        recipient=req.recipient,
        department=req.department,
        amount=req.amount,
        purpose=req.purpose,
        approval_status=approval_status,
        risk_level=risk_level,
        requires_step_up=requires_step_up,
        approved_by=current_user.full_name
    )
    db.add(new_tx)
    db.commit()

    source_ip = session.ip_address if session else "10.14.22.110"
    device_id = session.device_fingerprint if session else "DEV-FINANCE-HQ"
    location = f"{session.location_city}, {session.location_country}" if session else "Austin, USA (HQ)"

    await security_engine.monitor_api_invocation(
        db=db,
        user=current_user,
        endpoint="/api/payment/disburse",
        http_method="POST",
        source_ip=source_ip,
        device_id=device_id,
        location=location,
        status_code=200
    )

    return {
        "status": "DISBURSEMENT_INITIATED",
        "transaction_id": new_tx.transaction_id,
        "amount": new_tx.amount,
        "approval_status": new_tx.approval_status,
        "risk_level": new_tx.risk_level,
        "requires_step_up": new_tx.requires_step_up,
        "message": "Zero-Trust ABAC Constraint: Step-up cryptographic verification required for high-value transfer ($50,000+)" if approval_status == "PENDING_STEP_UP" else "Payment authorized and queued for municipal settlement"
    }

@router.post("/review")
async def review_transaction(
    req: ApprovalRequest,
    auth_data: tuple[User, UserSession] = Depends(enforce_abac_policy("TREASURY_PAYMENT", "WRITE", 3)),
    db: Session = Depends(get_db)
):
    current_user, session = auth_data
    tx = db.query(PaymentTransaction).filter(PaymentTransaction.transaction_id == req.transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if req.action == "APPROVE":
        tx.approval_status = "APPROVED"
    elif req.action == "REJECT":
        tx.approval_status = "REJECTED"
    elif req.action == "FLAG_SOC":
        tx.approval_status = "FLAGGED"
        tx.risk_level = "CRITICAL"

    db.commit()
    return {
        "status": "REVIEW_COMPLETED",
        "transaction_id": tx.transaction_id,
        "new_status": tx.approval_status,
        "reviewed_by": current_user.full_name
    }

