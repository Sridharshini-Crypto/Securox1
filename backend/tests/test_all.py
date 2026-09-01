import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from main import app
from database import init_db, SessionLocal
from ml_engine import anomaly_engine
from models import UserSession, User

# Initialize DB for testing
init_db()

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OPERATIONAL"
    assert data["zero_trust_status"] == "ACTIVE"

def test_login_success_normal_admin():
    response = client.post("/api/auth/login", json={
        "username": "admin01",
        "password": "Securox@Gov2026!",
        "device_fingerprint": "DEV-SEC-LAPTOP-HQ-01",
        "source_ip": "10.14.22.105",
        "location_city": "Austin",
        "location_country": "USA",
        "passkey_credential": "FIDO2_SEC_ADMIN01_TOKEN"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "admin01"
    assert data["user"]["role"] == "SUPER_ADMIN"
    assert data["risk_assessment"]["anomaly_score"] < 0.50

def test_login_failed_password():
    response = client.post("/api/auth/login", json={
        "username": "compliance_auditor",
        "password": "WrongPassword123!",
        "device_fingerprint": "DEV-UNTRUSTED-001",
        "source_ip": "198.51.100.99",
        "location_city": "Berlin",
        "location_country": "DE"
    })
    assert response.status_code in [401, 403]

def test_real_session_revocation():
    login_resp = client.post("/api/auth/login", json={
        "username": "admin01",
        "password": "Securox@Gov2026!"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200

    logout_resp = client.post("/api/auth/logout", headers=headers)
    assert logout_resp.status_code == 200

    revoked_check = client.get("/api/auth/me", headers=headers)
    assert revoked_check.status_code == 401
    assert "revoked" in revoked_check.json()["detail"].lower()

def test_abac_policy_enforcement_traffic_grid():
    login_resp = client.post("/api/auth/login", json={
        "username": "muni_lead",
        "password": "Securox@Gov2026!"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    override_resp = client.post("/api/traffic/override-signal", headers=headers, json={
        "intersection_code": "INT-001",
        "target_state": "ALL_RED",
        "automated_mode": False
    })
    assert override_resp.status_code == 403
    assert "ABAC_DENIED" in override_resp.json()["detail"] or "Insufficient clearance" in override_resp.json()["detail"]

def test_abac_treasury_high_value_step_up_constraint():
    login_resp = client.post("/api/auth/login", json={
        "username": "treasury_lead",
        "password": "Securox@Gov2026!"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    disburse_resp = client.post("/api/payment/disburse", headers=headers, json={
        "recipient": "Apex Civil Constructors Ltd",
        "department": "Infrastructure",
        "amount": 150000.0,
        "purpose": "Major Highway Overpass Reconstruction"
    })
    assert disburse_resp.status_code == 200
    data = disburse_resp.json()
    assert data["approval_status"] == "PENDING_STEP_UP"
    assert data["requires_step_up"] == True

def test_lanl_research_benchmark_metrics():
    resp = client.get("/api/ml/benchmark-lanl")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "SUCCESS"
    assert "metrics" in data
    assert "source_files" in data["benchmark_report"]
    assert "dns.txt.gz" in data["benchmark_report"]["source_files"][0]
    assert data["metrics"]["accuracy"] > 0.60
    assert data["metrics"]["roc_auc"] > 0.60
    assert "baseline_comparison" in data

def test_simulator_flagship_scenario():
    sim_resp = client.post("/api/simulator/trigger", json={
        "scenario_id": "SCENARIO_FLAGSHIP_CHAIN"
    })
    assert sim_resp.status_code == 200
    data = sim_resp.json()
    assert "stages_executed" in data or "attack_stages_executed" in data
    assert len(data.get("stages_executed", data.get("attack_stages_executed", []))) >= 6

def test_security_export_securox_schema():
    login_resp = client.post("/api/auth/login", json={
        "username": "admin01",
        "password": "Securox@Gov2026!"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    export_resp = client.get("/api/security/export-securox-stream", headers=headers)
    assert export_resp.status_code == 200
    data = export_resp.json()
    assert data["export_metadata"]["source_system"] == "SECUROX-GOV-ADMIN-PORTAL"
    assert len(data["securox_events"]) > 0

def test_user_registration():
    import uuid
    uid = uuid.uuid4().hex[:6]
    reg_resp = client.post("/api/auth/register", json={
        "username": f"officer_{uid}",
        "email": f"officer_{uid}@nic.in",
        "password": "SecurePassword2026!",
        "full_name": "Major General R. Verma",
        "department": "National Cyber Coordination Centre",
        "role_name": "AUDITOR",
        "device_name": "Gov-Issued Workstation",
        "passkey_credential": f"FIDO2_OFFICER_{uid}_TOKEN"
    })
    assert reg_resp.status_code == 201
    reg_data = reg_resp.json()
    assert reg_data["status"] == "ACCOUNT_CREATED"
    assert reg_data["user"]["username"] == f"officer_{uid}"

    # Verify new user can log in
    login_resp = client.post("/api/auth/login", json={
        "username": f"officer_{uid}",
        "password": "SecurePassword2026!"
    })
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()


