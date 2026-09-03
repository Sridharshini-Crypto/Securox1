# Securox — Cyber Risk Intelligence for Connected Public Infrastructure

**Sovereign Digital Infrastructure Security & Zero-Trust Command Platform**

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/Frontend-React_18-61DAFB.svg)](https://reactjs.org/)
[![NIST SP 800-207](https://img.shields.io/badge/Zero_Trust-NIST_SP_800--207-0B4EA2.svg)](https://csrc.nist.gov/publications/detail/sp/800-207/final)
[![Defensible ML](https://img.shields.io/badge/ML_Engine-Zero_Leakage-10B981.svg)](https://github.com/Sridharshini-Crypto/Securox)

---

## Executive Summary

**Securox** is a government-grade cyber risk intelligence platform designed to monitor, analyse, and protect interconnected public-sector digital services, municipal infrastructure, and sovereign data assets. 

Rather than functioning as a commercial cybersecurity SaaS dashboard, Securox operates as an **institutional digital infrastructure platform with a continuous cybersecurity intelligence layer underneath**. It integrates unsupervised anomaly detection, 4-tier Attribute-Based Access Control (ABAC), tamper-evident SHA-256 audit ledgers, and digital twin cascade blast-radius modeling.

---

## Core Capabilities & Feature Classification

In compliance with strict technical truthfulness and defensibility standards, all platform capabilities are explicitly classified:

### 1. Real Production Implementations (Dataset-Driven)
* **Unsupervised Anomaly Detection Core**: 150-tree Isolation Forest trained directly on **73,287 authentic entity sliding windows** streamed from Los Alamos National Laboratory (`dns.txt.gz`).
* **Zero Target Leakage Feature Space**: 6 clean behavioral metrics (`query_frequency`, `unique_destinations`, `destination_entropy`, `query_rate_per_min`, `destination_fanout_ratio`, `new_destination_ratio`).
* **Post-Hoc Empirical Benchmark**: Independent ground-truth evaluation against 749 Red Team compromise events (`redteam.txt.gz`) yielding genuine precision ($45.4\%$), recall ($44.4\%$), and F1-score ($44.9\%$).
* **Risk-Adaptive ABAC Matrix**: Dynamic risk scoring ($0\text{–}100$) evaluating hardware device enrollment, external IP routes, Haversine impossible travel ($>900\text{ km/h}$), clearance level, and high-value transactions ($\ge \text{₹}2.5\text{M}$).
* **Real Session Revocation**: Immediate token revocation and session invalidation upon logout or SOC directive.
* **Tamper-Evident SHA-256 Audit Trail**: Chained cryptographic hashes verifying ledger immutability.
* **Incident Deep-Dive & Containment**: Real-time session termination, step-up challenge triggers, and user lockouts.

### 2. Controlled What-If Security Scenarios (Sandboxed)
* **Interactive Threat Simulation**: Multi-stage attack progression (Credential Stuffing $\rightarrow$ Impossible Travel $\rightarrow$ API Burst $\rightarrow$ Traffic Grid Signal Override $\rightarrow$ Treasury Disbursement Fraud).
* **Clear Origin Badging**: All simulation events are labeled `CONTROLLED WHAT-IF SIMULATION` to prevent contamination of live telemetry.

### 3. Research Directions & Planned Capabilities
* **Connected Vehicle IoV CAN-Bus**: Signal override and speed spoofing research using CAN arbitration streams (`decimal/`, `binary/`).
* **Multi-Party Privacy-Preserving Analytics**: Future federated and split learning across disparate municipal departments.

---

## System Architecture

```
                       GOVERNMENT SERVICES INGRESS
                                   │
              ┌────────────────────┼────────────────────┐
              ↓                    ↓                    ↓
         PUBLIC FINANCE    MUNICIPAL SERVICES    SMART TRAFFIC
         (Treasury API)     (Citizen Permits)   (Grid Controller)
              │                    │                    │
              └────────────────────┼────────────────────┘
                                   ↓
                       SECUROX INTELLIGENCE ENGINE
                                   │
            ┌──────────────────────┼──────────────────────┐
            ↓                      ↓                      ↓
      ANOMALY DETECTION       RISK ENGINE & ABAC     DIGITAL TWIN
     (150 Isolation Trees)   (4 Policy Action Tiers) (Cascade Graph)
```

---

## 5-Stage Data Lineage Provenance

Securox enforces end-to-end data provenance from disk files to SOC risk scores:

$$\text{Raw Dataset Ingestion } \longrightarrow \text{ Preprocessing } \longrightarrow \text{ Clean 6-D Feature Vector } \longrightarrow \text{ Isolation Forest } \longrightarrow \text{ Post-Hoc Benchmark}$$

1. **Stage 1: Raw Ingestion**: Streaming gzip parser (`dns.txt.gz` $176.5\text{ MB}$, `redteam.txt.gz` $4.8\text{ KB}$).
2. **Stage 2: Feature Engineering**: 6 unlabelled behavioral metrics without red-team label leakage.
3. **Stage 3: Standardization**: $\text{StandardScaler}(z = \frac{x - \mu}{\sigma})$ empirical distribution baseline.
4. **Stage 4: Model Architecture**: 150-Tree Isolation Forest ($\text{Contamination} = 20.0\%$).
5. **Stage 5: Post-Hoc Evaluation**: Evaluated against 749 authentic Red Team ground-truth timestamps.

---

## Security Policy Enforcement Matrix (ABAC)

Dynamic Risk Score ($0\text{–}100$):
* Base known session: $+5$
* Unenrolled / Unknown Hardware Device: $+20$
* External Untrusted Network IP: $+10$
* Haversine Impossible Travel ($>900\text{ km/h}$): $+30$
* High Criticality without Level 4+ Clearance: $+25$
* High-Value Sovereign Disbursement ($> \text{₹}2.5\text{M}$): $+20$

| Risk Tier | Score Range | Action Enforced | Enforcement Mechanism |
| :--- | :--- | :--- | :--- |
| **NORMAL** | $0\text{–}30$ | `ALLOW` | Standard authorized session |
| **STEP_UP** | $31\text{–}60$ | `STEP_UP_REQUIRED` | FIDO2 Hardware Passkey Attestation |
| **RESTRICTED** | $61\text{–}80$ | `RESTRICTED` | Read-only degraded mode |
| **BLOCKED** | $81\text{–}100$ | `DENY_AND_BLOCK` | Session revoked + SOC incident triggered |

---

## Technology Stack

* **Backend**: Python 3.10+, FastAPI, SQLAlchemy, SQLite (WAL mode), scikit-learn, NumPy.
* **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, Axios.
* **Security & Auth**: PyJWT, Argon2 / PBKDF2 Password Hashing, WebAuthn/FIDO2 Attestation Schemas.
* **Real-Time Stream**: FastAPI WebSockets.

---

## Quick Start & Installation

### Prerequisites
* Python 3.10 or higher
* Node.js 18+ and npm

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python main.py
```
*Backend runs at `http://localhost:8000` (Swagger docs at `/docs`).*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at `http://localhost:5173`.*

### 3. Running Automated Tests
```bash
cd backend
python -c "
import sys; sys.path.insert(0, '.')
from tests.test_all import *
test_root_endpoint()
test_login_success_normal_admin()
test_login_failed_password()
test_real_session_revocation()
test_abac_policy_enforcement_traffic_grid()
test_abac_treasury_high_value_step_up_constraint()
test_lanl_research_benchmark_metrics()
test_simulator_flagship_scenario()
test_security_export_securox_schema()
test_user_registration()
print('>>> ALL 10 TESTS PASSED (100% SUCCESS)')
"
```

---

## License & Compliance

Designed in accordance with **NIST Special Publication 800-207 (Zero Trust Architecture)** and public sector critical infrastructure protection guidelines.
