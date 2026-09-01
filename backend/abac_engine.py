from typing import Optional, Dict, Any, List
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
    denial_reason: Optional[str] = None
    subject_context: Dict[str, Any] = {}
    resource_context: Dict[str, Any] = {}
    environment_context: Dict[str, Any] = {}

class ZeroTrustPolicyEngine:
    """
    Attribute-Based Access Control (ABAC) + Role-Based Access Control (RBAC) Engine.
    Evaluates Subject, Resource, Action, and Environmental context for every critical action.
    """

    def evaluate(self, req: PolicyEvaluationRequest) -> AbacDecision:
        user: User = req.user
        session: Optional[UserSession] = req.session

        # 1. Subject Attributes
        role_name = user.role.name if user.role else "ANONYMOUS"
        clearance = user.security_clearance_level
        is_active = user.is_active
        step_up_verified = session.step_up_verified if session else False
        session_risk = session.risk_score if session else 0.50
        is_trusted_device = bool(session and not ("UNRECOGNIZED" in session.device_fingerprint or "BOTNET" in session.device_fingerprint or "ADVERSARY" in session.device_fingerprint))

        # 2. Environmental Attributes
        ip_addr = session.ip_address if session else "0.0.0.0"
        is_internal_ip = bool(ip_addr.startswith("10.") or ip_addr.startswith("172.") or ip_addr.startswith("192.168."))
        location = f"{session.location_city}, {session.location_country}" if session else "Unknown"
        is_hq_location = bool("Austin" in location or "HQ" in location)

        subject_ctx = {
            "username": user.username,
            "role": role_name,
            "clearance_level": clearance,
            "step_up_verified": step_up_verified,
            "session_risk": round(session_risk, 3),
            "is_trusted_device": is_trusted_device
        }
        resource_ctx = {
            "resource": req.resource,
            "action": req.action,
            "criticality": req.criticality,
            "amount": req.amount
        }
        env_ctx = {
            "ip_address": ip_addr,
            "is_internal_ip": is_internal_ip,
            "location": location,
            "is_hq_location": is_hq_location
        }

        # Check Active User
        if not is_active:
            return AbacDecision(
                allowed=False,
                policy_name="USER_ACCOUNT_STATUS_POLICY",
                denial_reason="User account is inactive or disabled by SOC.",
                subject_context=subject_ctx,
                resource_context=resource_ctx,
                environment_context=env_ctx
            )

        # -------------------------------------------------------------
        # POLICY 1: Critical Traffic Grid Infrastructure (Level 4)
        # -------------------------------------------------------------
        if req.resource == "TRAFFIC_GRID" and req.action in ["OVERRIDE_SIGNAL", "EMERGENCY_BROADCAST", "WRITE"]:
            if role_name not in ["TRAFFIC_CONTROLLER", "SUPER_ADMIN"] or clearance < 4:
                return AbacDecision(
                    allowed=False,
                    policy_name="TRAFFIC_GRID_RBAC_POLICY",
                    denial_reason=f"Insufficient clearance (Role '{role_name}', Level {clearance}). Requires TRAFFIC_CONTROLLER Level 4+.",
                    subject_context=subject_ctx,
                    resource_context=resource_ctx,
                    environment_context=env_ctx
                )

            if (session_risk >= 0.40 or not is_trusted_device or not is_hq_location) and not step_up_verified:
                return AbacDecision(
                    allowed=False,
                    requires_step_up=True,
                    policy_name="TRAFFIC_GRID_ZERO_TRUST_STEP_UP_POLICY",
                    denial_reason="Critical Traffic Infrastructure requires cryptographic step-up verification due to elevated session risk or non-trusted device context.",
                    subject_context=subject_ctx,
                    resource_context=resource_ctx,
                    environment_context=env_ctx
                )

            return AbacDecision(
                allowed=True,
                policy_name="TRAFFIC_GRID_AUTHORIZED_POLICY",
                subject_context=subject_ctx,
                resource_context=resource_ctx,
                environment_context=env_ctx
            )

        # -------------------------------------------------------------
        # POLICY 2: Municipal Treasury & High-Value Payments (Level 3)
        # -------------------------------------------------------------
        if req.resource == "TREASURY_PAYMENT":
            if req.action in ["DISBURSE_FUNDS", "WRITE"]:
                if role_name not in ["FINANCE_OFFICER", "SUPER_ADMIN"] or clearance < 3:
                    return AbacDecision(
                        allowed=False,
                        policy_name="TREASURY_RBAC_POLICY",
                        denial_reason=f"Insufficient clearance for treasury payout (Role '{role_name}', Level {clearance}).",
                        subject_context=subject_ctx,
                        resource_context=resource_ctx,
                        environment_context=env_ctx
                    )

                amt = req.amount or 0.0
                if amt >= 50000.0 and not step_up_verified:
                    return AbacDecision(
                        allowed=False,
                        requires_step_up=True,
                        policy_name="TREASURY_HIGH_VALUE_STEP_UP_POLICY",
                        denial_reason=f"High-value disbursement (${amt:,.2f}) exceeds $50,000 threshold and requires executive step-up authorization.",
                        subject_context=subject_ctx,
                        resource_context=resource_ctx,
                        environment_context=env_ctx
                    )

            return AbacDecision(
                allowed=True,
                policy_name="TREASURY_AUTHORIZED_POLICY",
                subject_context=subject_ctx,
                resource_context=resource_ctx,
                environment_context=env_ctx
            )

        # -------------------------------------------------------------
        # POLICY 3: User Role & Privilege Management (Level 5)
        # -------------------------------------------------------------
        if req.resource == "USER_ROLES" and req.action == "ASSIGN_ROLE":
            if role_name != "SUPER_ADMIN" or clearance < 5:
                return AbacDecision(
                    allowed=False,
                    policy_name="PRIVILEGE_ADMIN_RBAC_POLICY",
                    denial_reason=f"Only SUPER_ADMIN Level 5 can reassign roles. Attempted by '{role_name}' Level {clearance}.",
                    subject_context=subject_ctx,
                    resource_context=resource_ctx,
                    environment_context=env_ctx
                )

            if (session_risk >= 0.40 or not is_trusted_device) and not step_up_verified:
                return AbacDecision(
                    allowed=False,
                    requires_step_up=True,
                    policy_name="PRIVILEGE_ZERO_TRUST_STEP_UP_POLICY",
                    denial_reason="Privilege modification on elevated-risk session requires biometric/passkey step-up elevation.",
                    subject_context=subject_ctx,
                    resource_context=resource_ctx,
                    environment_context=env_ctx
                )

            return AbacDecision(
                allowed=True,
                policy_name="PRIVILEGE_ADMIN_AUTHORIZED_POLICY",
                subject_context=subject_ctx,
                resource_context=resource_ctx,
                environment_context=env_ctx
            )

        # -------------------------------------------------------------
        # POLICY 4: Municipal Permits & Records (Level 2)
        # -------------------------------------------------------------
        if req.resource == "MUNICIPAL_PERMITS":
            if req.action in ["WRITE", "OVERRIDE"] and (role_name not in ["MUNICIPAL_DIRECTOR", "SUPER_ADMIN"] or clearance < 3):
                return AbacDecision(
                    allowed=False,
                    policy_name="MUNICIPAL_PERMITS_RBAC_POLICY",
                    denial_reason=f"Insufficient clearance for municipal permit creation/override (Role '{role_name}').",
                    subject_context=subject_ctx,
                    resource_context=resource_ctx,
                    environment_context=env_ctx
                )

            return AbacDecision(
                allowed=True,
                policy_name="MUNICIPAL_PERMITS_AUTHORIZED_POLICY",
                subject_context=subject_ctx,
                resource_context=resource_ctx,
                environment_context=env_ctx
            )

        # Default Read Policy
        return AbacDecision(
            allowed=True,
            policy_name="DEFAULT_ZERO_TRUST_READ_POLICY",
            subject_context=subject_ctx,
            resource_context=resource_ctx,
            environment_context=env_ctx
        )

abac_engine = ZeroTrustPolicyEngine()

