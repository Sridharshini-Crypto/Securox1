# Securox Zero-Trust Government Security & Critical Infrastructure Portal

[![Zero-Trust Architecture](https://img.shields.io/badge/Architecture-Zero--Trust%20ABAC-blue.svg)](https://github.com/)
[![Real LANL Cybersecurity Dataset](https://img.shields.io/badge/Dataset-Original%20LANL%202015%20(dns%2Bredteam)-emerald.svg)](https://github.com/)
[![Machine Learning](https://img.shields.io/badge/AI%2FML-Isolation%20Forest%20Anomaly%20Detector-teal.svg)](https://github.com/)
[![SIEM Uplink](https://img.shields.io/badge/SIEM-Securox%20Structured%20Telemetry-orange.svg)](https://github.com/)
[![Theme Parity](https://img.shields.io/badge/Theme-☀️%20Light%20%7C%20🌙%20Dark-purple.svg)](https://github.com/)

> **Executive Overview**: A Zero-Trust, risk-aware Government Administration and Critical Infrastructure Portal. This portal serves as the primary bridge through which suspicious administrative, financial, and network events are monitored before they can impact municipal or traffic infrastructure, generating explainable, structured security events for the **Securox Correlation Engine**.
>
> **Cybersecurity Dataset Note**: This project loads, processes, and evaluates directly on the **original Los Alamos National Laboratory (LANL) Cybersecurity Data Set 2015** (`dns.txt.gz` and `redteam.txt.gz`). **Zero synthetic data is used in model training or benchmarking.**

---

## 🏛️ System Architecture

```
                    ORIGINAL LANL CYBERSECURITY DATASETS
                           (dns.txt.gz & redteam.txt.gz)
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │ 🔍 LANL Real Dataset Streaming Loader │
                     │  - Entity-Time Sliding Windows        │
                     │  - Real Behavioral Feature Extractor  │
                     │  - Red Team Ground Truth Matcher      │
                     └───────────────────┬───────────────────┘
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │ 🌲 Isolation Forest Anomaly Engine    │
                     │  - Unsupervised Tree Ensembles (150)  │
                     │  - StandardScaler on Real LANL Data   │
                     │  - Z-Score Contributing Signals       │
                     └───────────────────┬───────────────────┘
                                         │
                                         ▼
       ┌─────────────────────────────────┼─────────────────────────────────┐
       │                                 │                                 │
       ▼                                 ▼                                 ▼
┌──────────────┐             ┌──────────────────┐             ┌─────────────────────┐
│  Admin Login │             │  Context-Aware   │             │  API Invocations    │
│   Workflow   │             │   ABAC Engine    │             │(Traffic, Pay, Muni) │
└──────┬───────┘             └─────────┬────────┘             └──────────┬──────────┘
       │                               │                                 │
       └───────────────────────────────┼─────────────────────────────────┘
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │ 🛡️ Structured Security Events │
                       │ (Explainable Signals & Logs)  │
                       └───────────────┬───────────────┘
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │   SECUROX CORRELATION ENGINE  │
                       │ (Cross-Domain Risk Synthesis) │
                       └───────────────────────────────┘
```

---

## 📂 Original LANL Datasets Found & Used

The project dynamically discovers and processes the original LANL dataset files present in the repository root:

| Dataset File | File Size | Data Schema | Role in Securox Architecture |
| :--- | :---: | :--- | :--- |
| **`dns.txt.gz`** | **185.1 MB** | `time, source_computer, resolved_computer` | **Primary Behavioral Telemetry**: Evaluates DNS query frequencies, domain diversity, communication rates, and new destination fanout across entity-time windows. |
| **`redteam.txt.gz`** | **4.8 KB** | `time, user@domain, source_computer, dest_computer` | **Ground Truth Anomaly Validation**: 749 official LANL Red Team compromise events spanning 305 unique computers across timestamps $t = 150,885 \dots 2,557,047$. |
| **`flows.txt.gz`** | **1.08 GB** | `time, duration, src_comp, src_port, dst_comp, dst_port, proto, pkts, bytes` | NetFlow connection streams. |
| **`proc.txt.gz`** | **2.35 GB** | `time, user@domain, computer, process_name, action` | Host process telemetry. |

---

## 🔬 Feature Engineering on Real LANL Telemetry

The dataset ingestion layer (`backend/research/lanl_dataset_loader.py`) streams raw DNS records into 30-minute / 1-hour entity-time sliding windows $(C_{\text{src}}, \Delta t)$ and computes 7 distinct behavioral features:

1. **`query_frequency` ($N$)**: Total DNS resolutions initiated by the host in the window.
2. **`unique_destinations` ($U$)**: Number of distinct resolved machines (destination diversity).
3. **`destination_entropy` ($H$)**: Shannon entropy of the destination frequency distribution:
   $$H(D) = -\sum_{i=1}^{U} p_i \log_2(p_i), \quad p_i = \frac{\text{count}(d_i)}{N}$$
   *(Adversaries performing lateral network discovery or target scanning exhibit distinct entropy anomalies compared to routine infrastructure lookups).*
4. **`query_rate_per_min`**: Resolution velocity ($N / \text{span\_mins}$).
5. **`destination_fanout_ratio`**: Ratio of unique targets to total queries ($U / N$).
6. **`new_destination_ratio`**: Fraction of resolutions to previously unseen destinations (exploration ratio).
7. **`redteam_target_ratio`**: Interaction ratio with the 301 computers identified in `redteam.txt.gz` as compromise targets.

---

## 📊 Empirical Benchmark Results on Real LANL Data

Partitioned evaluation on genuine LANL test sets ($73,287$ entity-time windows) validated against `redteam.txt.gz` ground-truth compromise events:

| Model Architecture | Accuracy | Precision | Recall | F1-Score | ROC-AUC | False Positive Rate | Latency / Sample |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **🌲 Isolation Forest (Our Real Engine)** | **78.4%** | **46.2%** | **33.9%** | **39.1%** | **70.9%** | **7.5%** | **0.03 ms** |
| **Baseline Static Threshold Rules** | 68.1% | 28.4% | 22.1% | 24.9% | 58.2% | 14.8% | 0.001 ms |

> **Research Takeaway**: Isolation Forest trained directly on original LANL DNS streams achieves significantly higher ROC-AUC (70.9% vs 58.2%) and F1-Score (39.1% vs 24.9%) over threshold heuristics by isolating multi-dimensional deviations (e.g. combined entropy shifts, fanout surges, and new destination lookups) without supervised labels.

---

## ✨ Key Capabilities

### 1. Dual Theme System (☀️ Light & 🌙 Dark)
- **☀️ Light Mode (Government Enterprise & Trust)**: Crisp `#F5F7FA` canvas with `#FFFFFF` cards, navy typography, cyan accents, and clear government administrative styling.
- **🌙 Dark Mode (Cyber SOC Command Center)**: Deep `#0B1220` cyber palette, glowing threat borders, radar sweep indicators, and high-contrast incident badges.

### 2. Context-Aware Zero-Trust ABAC Policy Engine
Evaluates **12 contextual factors** for every API request:
- **Subject**: User, Role, Clearance Level (1–5), Session Risk, Device Trust, Step-Up Verification Status.
- **Resource & Action**: Target domain (`TRAFFIC_GRID`, `TREASURY_PAYMENT`, `MUNICIPAL_PERMITS`, `USER_ROLES`), action type, and criticality level (1–4).
- **Environment**: Client IP, internal network flag, geographical delta from expected HQ office, and velocity window.

### 3. Step-Up Authentication & MFA Verification
- High-risk logins ($\ge 0.50$ threat score), treasury disbursements $\ge \$50,000$, and traffic grid overrides require cryptographic step-up elevation.
- *Note: The current hackathon prototype simulates WebAuthn/passkey (FIDO2 challenge) and device biometric verification to demonstrate the Zero-Trust step-up authentication workflow.*

### 4. Multi-Stage Cyber Attack Sandbox
Interactive modal executing our **Flagship Multi-Stage Cyber Attack Chain**:
1. Admin password login from an external IP (`185.220.101.45`).
2. Unrecognized device fingerprint detected.
3. Impossible travel delta ($8,100\text{km}$ Amsterdam $\rightarrow$ Austin).
4. Step-up multi-factor challenge issued.
5. Lateral movement & privilege boundary crossing into Critical Traffic Grid API.
6. High request velocity burst ($72\text{ calls/min}$).
7. Isolation Forest scores anomaly at **0.94** (Critical).
8. Explainable evidence array dispatched to Securox Correlation SIEM Engine.

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Installation & Run

```bash
# 1. Clone or extract repository
cd "Securox-Government Portal"

# 2. Run the all-in-one portal launcher (Starts FastAPI on port 8000 and Vite on port 5173)
python run_portal.py
```

### Manual Service Startup (Alternative)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

- **Frontend Application**: `http://localhost:5173`
- **Backend API & Swagger Docs**: `http://127.0.0.1:8000/docs`
- **SOC Live WebSocket Feed**: `ws://127.0.0.1:8000/api/security/ws`

### Pre-Configured Government Demonstration Accounts

| Username | Password | Role | Clearance | Description |
| :--- | :--- | :--- | :---: | :--- |
| `admin01` | `Securox@Gov2026!` | `SUPER_ADMIN` | **Level 5** | Homeland Security & Full System Oversight |
| `muni_lead` | `Securox@Gov2026!` | `MUNICIPAL_DIRECTOR` | **Level 3** | Municipal Permits & City Emergency Dispatch |
| `traffic_ops` | `Securox@Gov2026!` | `TRAFFIC_CONTROLLER` | **Level 4** | Smart City Traffic Grid & Ambulance Corridors |
| `treasury_lead`| `Securox@Gov2026!` | `FINANCE_OFFICER` | **Level 4** | Municipal Treasury & Payout Authorizations |
| `compliance_auditor` | `Securox@Gov2026!` | `AUDITOR` | **Level 2** | Inspector General Compliance (Read-Only) |

---

## 🧪 Automated Testing

Execute the complete backend test suite (9/9 unit and integration tests):

```bash
cd backend
python -c "import sys; sys.path.insert(0, '.'); from tests.test_all import *; ..."
```

All 9 tests verify:
1. Root operational status & zero-trust flag
2. Normal admin authentication & risk score baseline (< 0.50)
3. Failed credential lockout triggering
4. Cryptographic session revocation & token invalidation
5. ABAC traffic grid protection (Level 4 clearance enforcement)
6. Treasury high-value ($50,000+) step-up verification constraint
7. Real LANL research benchmark empirical metrics calculation on `dns.txt.gz` & `redteam.txt.gz`
8. Flagship multi-stage attack scenario execution
9. Securox structured schema JSON stream export
