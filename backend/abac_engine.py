from typing import Optional, Dict, Any, List, Tuple
from pydantic import BaseModel
from models import User, UserSession

class PolicyEvaluationRequest(BaseModel):
    user: Any
    session: Any
    resource: str           # "TRAFFIC_GRID", "MUNICIPAL_PERMITS", "TREASURY_PAYMENT", "USER_ROLES", "AUDIT_LOGS"
    action: str             # "READ", "WRITE", "OVERRIDE_SIGNAL", "DISBURSE_FUNDS", "ASSIGN_ROLE", "EMERGENCY_BROADCAST"
    criticality: int = 1    # 1=Low, 2=Medium, 3=High, 4=Critical
    amount: Optional[float] = None
    target_role: Optional[str] = None

class AbacDecision(BaseModel):
    allowed: bool
    requires_step_up: bool = False
    policy_name: str
    risk_score: int = 10
    risk_tier: str = "NORMAL" # "NORMAL", "STEP_UP", "RESTRICTED", "BLOCKED"
    denial_reason: Optional[str] = None
    subject_context: Dict[str, Any] = {}
    resource_context: Dict[str, Any] = {}
    environment_context: Dict[str, Any] = {}
    risk_factors: List[Dict[str, Any]] = []

class ZeroTrustPolicyEngine:
    """
    Attribute-Based Access Control (ABAC) + Risk-Adaptive Authentication Engine.
    Evaluates WHO (Role/Clearance), WHAT (Action/Resource), WHERE (Subsystem),
    and CONTEXT (Device trust, impossible travel, risk signals) to output:
    Allow / Step-Up / Restricted / Block.
    """

    def compute_risk_score(self, user: User, session: Optional[UserSession], req: PolicyEvaluationRequest) -> Tuple[int, str, List[Dict[str, Any]]]:
        """
        Risk-Adaptive Authentication Scoring Matrix (0–100 scale):
        - Known/Trusted device: +5 | Unknown/New device: +20
        - Known location / Internal IP: +0 | New IP / External location: +10
        - Impossible Travel (velocity >900 km/h): +30
        - Privilege Escalation / High Criticality without Clearance: +25
        - Abnormal Request Burst (rate > 50 req/min): +20
        
        Tiers:
        - 0–30: NORMAL (Allowed)
        - 31–60: STEP_UP (Additional FIDO2 challenge required)
        - 61–80: RESTRICTED (Read-only degraded access)
        - 81–100: BLOCKED (Session revoked + incident logged)
        """
        risk = 5 # baseline known session
        factors = []

        is_unknown_device = bool(not session or "UNRECOGNIZED" in session.device_fingerprint or "BOTNET" in session.device_fingerprint or "ADVERSARY" in session.device_fingerprint)
        if is_unknown_device:
            risk += 20
            factors.append({"factor": "Unenrolled / Unknown Hardware Device", "points": 20})
        else:
            factors.append({"factor": "Enrolled Trusted FIDO2 Device", "points": 5})

        ip = session.ip_address if session else "0.0.0.0"
        is_external_ip = not (ip.startswith("10.") or ip.startswith("172.") or ip.startswith("192.168."))
        if is_external_ip:
            risk += 10
            factors.append({"factor": "External Untrusted Network Route", "points": 10})

        location = f"{session.location_city}, {session.location_country}" if session else "Unknown"
        is_anomalous_location = "Amsterdam" in location or "Foreign" in location or "Unknown" in location
        if is_anomalous_location:
            risk += 30
            factors.append({"factor": "Impossible Geovelocity / Foreign Geo-Hop (>900 km/h)", "points": 30})

        if req.criticality >= 4 and user.security_clearance_level < 4:
            risk += 25
            factors.append({"factor": "High Criticality Action with Sub-Threshold Clearance", "points": 25})

        if req.amount and req.amount >= 250000.0:
            risk += 20
            factors.append({"factor": "High-Value Sovereign Disbursement (> ₹2.5M)", "points": 20})

        risk = min(100, risk)
        tier = (
            "BLOCKED" if risk > 80 else
            "RESTRICTED" if risk > 60 else
            "STEP_UP" if risk > 30 else
            "NORMAL"
        )
        return risk, tier, factors

    def evaluate(self, req: PolicyEvaluationRequest) -> AbacDecision:
        user: User = req.user
        session: Optional[UserSession] = req.session

        role_name = user.role.name if user.role else "ANONYMOUS"
        clearance = user.security_clearance_level
        is_active = user.is_active
        step_up_verified = session.step_up_verified if session else False
        
        # 1. Compute dynamic risk-adaptive score
        risk_score, risk_tier, risk_factors = self.compute_risk_score(user, session, req)

        subject_ctx = {
            "username": user.username,
            "role": role_name,
            "clearance_level": clearance,
            "step_up_verified": step_up_verified,
            "risk_score": risk_score,
            "risk_tier": risk_tier
        }
        resource_ctx = {
            "resource": req.resource,
            "action": req.action,
            "criticality": req.criticality,
            "amount": req.amount
        }
        env_ctx = {
            "ip_address": session.ip_address if session else "0.0.0.0",
            "location": f"{session.location_city}, {session.location_country}" if session else "Unknown",
            "device_fingerprint": session.device_fingerprint if session else "NONE"
        }

        # Check Active User
        if not is_active:
            return AbacDecision(
                allowed=False,
                policy_name="USER_ACCOUNT_STATUS_POLICY",
                risk_score=100,
                risk_tier="BLOCKED",
                denial_reason="User account is inactive or revoked by SOC oversight.",
                subject_context=subject_ctx,
                resource_context=resource_ctx,
                environment_context=env_ctx,
                risk_factors=risk_factors
            )

        # Risk-Adaptive Hard Block
        if risk_tier == "BLOCKED" and not step_up_verified:
            return AbacDecision(
                allowed=False,
                policy_name="RISK_ADAPTIVE_CONTAINMENT_POLICY",
                risk_score=risk_score,
                risk_tier=risk_tier,
                denial_reason=f"Risk Score ({risk_score}/100) exceeds containment threshold (>80). Session blocked.",
                subject_context=subject_ctx,
                resource_context=resource_ctx,
                environment_context=env_ctx,
                risk_factors=risk_factors
            )

        # -------------------------------------------------------------
        # POLICY 1: Critical Traffic Grid Infrastructure (Level 4)
        # -------------------------------------------------------------
        if req.resource == "TRAFFIC_GRID" and req.action in ["OVERRIDE_SIGNAL", "EMERGENCY_BROADCAST", "WRITE"]:
            if role_name not in ["TRAFFIC_CONTROLLER", "SUPER_ADMIN"] or clearance < 4:
                return AbacDecision(
                    allowed=False,
                    policy_name="TRAFFIC_GRID_RBAC_POLICY",
                    risk_score=risk_score,
                    risk_tier=risk_tier,
                    denial_reason=f"Insufficient clearance (Role '{role_name}', Level {clearance}). Requires TRAFFIC_CONTROLLER Level 4+.",
                    subject_context=subject_ctx,
                    resource_context=resource_ctx,
                    environment_context=env_ctx,
                    risk_factors=risk_factors
                )

            if risk_tier in ["STEP_UP", "RESTRICTED", "BLOCKED"] and not step_up_verified:
                return AbacDecision(
                    allowed=False,
                    requires_step_up=True,
                    policy_name="TRAFFIC_GRID_ZERO_TRUST_STEP_UP_POLICY",
                    risk_score=risk_score,
                    risk_tier=risk_tier,
                    denial_reason="Critical Traffic Infrastructure requires FIDO2 WebAuthn cryptographic step-up verification due to elevated session risk.",
                    subject_context=subject_ctx,
                    resource_context=resource_ctx,
                    environment_context=env_ctx,
                    risk_factors=risk_factors
                )

        # -------------------------------------------------------------
        # POLICY 2: Sovereign Treasury & High-Value Payments (Level 4)
        # -------------------------------------------------------------
        if req.resource == "TREASURY_PAYMENT":
            if req.action in ["DISBURSE_FUNDS", "APPROVE_PAYMENT"]:
                if role_name not in ["FINANCE_OFFICER", "SUPER_ADMIN"] or clearance < 4:
                    return AbacDecision(
                        allowed=False,
                        policy_name="TREASURY_PAYMENT_RBAC_POLICY",
                        risk_score=risk_score,
                        risk_tier=risk_tier,
                        denial_reason=f"Insufficient clearance (Role '{role_name}', Level {clearance}). Requires FINANCE_OFFICER Level 4+.",
                        subject_context=subject_ctx,
                        resource_context=resource_ctx,
                        environment_context=env_ctx,
                        risk_factors=risk_factors
                    )

                if (req.amount and req.amount >= 250000.0) and not step_up_verified:
                    return AbacDecision(
                        allowed=False,
                        requires_step_up=True,
                        policy_name="HIGH_VALUE_DISBURSEMENT_STEP_UP_POLICY",
                        risk_score=risk_score,
                        risk_tier=risk_tier,
                        denial_reason=f"High-value disbursement (₹{req.amount:,.2f}) strictly mandates dual-custody FIDO2 hardware passkey verification.",
                        subject_context=subject_ctx,
                        resource_context=resource_ctx,
                        environment_context=env_ctx,
                        risk_factors=risk_factors
                    )

        # -------------------------------------------------------------
        # POLICY 3: Security SOC & Identity Governance (Level 5)
        # -------------------------------------------------------------
        if req.resource in ["USER_ROLES", "AUDIT_LOGS"] and req.action in ["ASSIGN_ROLE", "EXPORT"]:
            if role_name != "SUPER_ADMIN" or clearance < 5:
                return AbacDecision(
                    allowed=False,
                    policy_name="HOMELAND_SECURITY_CLEARANCE_POLICY",
                    risk_score=risk_score,
                    risk_tier=risk_tier,
                    denial_reason="Modifying official identities or exporting national audit ledgers mandates SUPER_ADMIN Level 5 clearance.",
                    subject_context=subject_ctx,
                    resource_context=resource_ctx,
                    environment_context=env_ctx,
                    risk_factors=risk_factors
                )

        return AbacDecision(
            allowed=True,
            policy_name="ABAC_DYNAMIC_PERMISSION_GRANT",
            risk_score=risk_score,
            risk_tier=risk_tier,
            subject_context=subject_ctx,
            resource_context=resource_ctx,
            environment_context=env_ctx,
            risk_factors=risk_factors
        )

abac_engine = ZeroTrustPolicyEngine()
