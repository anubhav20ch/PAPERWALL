# PAPERWALL (QuantumShield)
### Post-Quantum Cryptographic Academic Paper Distribution & Anti-Leak Governance System

[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![NIST PQC](https://img.shields.io/badge/NIST%20PQC-FIPS%20203%20%7C%20204-indigo.svg)](https://csrc.nist.gov/projects/post-quantum-cryptography)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Executive Summary & Abstract

**PAPERWALL (QuantumShield)** is an enterprise-grade academic paper distribution and anti-leak governance platform engineered with **NIST-standardized Post-Quantum Cryptography (PQC)**. Designed in response to national exam paper leak crises (e.g. NEET-UG, UGC-NET, State PSC leaks) and nationwide student demonstrations at **Jantar Mantar, New Delhi**, PAPERWALL eliminates single points of trust in paper distribution pipelines.

By integrating **NIST FIPS 203 (ML-KEM-768)** for quantum-resistant key encapsulation and **NIST FIPS 204 (ML-DSA-65)** for non-repudiable digital signatures, PAPERWALL ensures that high-value examination materials remain cryptographically sealed until the exact moment of examination, protecting sensitive data against both human interception today and **Harvest-Now-Decrypt-Later (HNDL)** attacks by future quantum computers.

---

## 👥 Creators & Technical Contributions

- **Anubhav Choudhary**: *Research & Cryptographic Engine Creation*  
  Engineered the core PQC cryptographic engine (`crypto_helpers.py`), integrating NIST FIPS 203 (ML-KEM-768), FIPS 204 (ML-DSA-65), AES-256-GCM, and SHA3-256 primitives, and conducted foundational research against HNDL quantum attack vectors.
- **Abhijeet Kumar Chauhan**: *Frontend Creation as well as Integration Components*  
  Designed and implemented the complete React 18 + TypeScript Single Page Application (SPA), including interactive security dashboards, real-time WebSocket Crypto Visualizer, NIST FIPS-197 AES Sandbox, and REST API integration.
- **Arpit Shah**: *Cryptographic Integration of the Parts*  
  Architected the end-to-end integration between post-quantum cryptographic key release, Zero-Trust Access Policy engine, Examination State Machine gating, and immutable SHA3-linked provenance audit chains.

---

## 🔑 Key Features & Innovations

1. **Post-Quantum Cryptography Core (`crypto_helpers.py`)**:
   - **NIST FIPS 203 ML-KEM-768 (Kyber768)**: Quantum-resistant key encapsulation mechanism providing Category 3 security (AES-192 equivalent) with implicit rejection.
   - **NIST FIPS 204 ML-DSA-65 (Dilithium3)**: Module lattice digital signatures ensuring existential unforgeability (EUF-CMA) and distributor non-repudiation.
   - **AES-256-GCM**: Authenticated symmetric payload encryption for PDF documents.
   - **SHA3-256 & HKDF-SHA3-256**: FIPS 202 cryptographic digests and transcript-bound key schedules.

2. **Time-Gated Examination State Machine Lockbox (`exams.py`)**:
   - Papers pass through state transitions: `created` $\rightarrow$ `locked` $\rightarrow$ `released` $\rightarrow$ `closed`.
   - Decryption keys are strictly locked until the exact scheduled examination start time.

3. **Zero-Trust Access Policy Engine (`policies.py`)**:
   - Evaluates recipient role authorization (e.g. Exam Centre Role 3), UTC access time windows (`valid_from` to `valid_until`), and per-document download quotas (`current_downloads < max_downloads`).

4. **Immutable SHA3 Provenance Event Chains (`provenance.py`)**:
   - Every lifecycle event (`Created`, `Downloaded`, `KeyRotated`) writes a SHA3-linked `ProvenanceEvent` record (`prev_record_hash = SHA3-256(prev_event)`), making database tampering immediately detectable (`CHAIN_BROKEN`).

5. **Attack Simulation Lab (`AttackSimulation.tsx` & `simulations.py`)**:
   - Features side-by-side attack testing on **Secured PQC Targets** (`ATTACK BLOCKED` 🛡️) vs **Vulnerable Targets** (`ATTACK SUCCEEDED / BREACHED` ⚠️).
   - Simulates file tampering, signature forgery, wrong AES keys, Kyber key corruption, unauthorized access, and live post-quantum key rotation.

6. **Real-time Telemetry & Interactive Educational Sandboxes**:
   - Auth-gated WebSocket stream (`/ws/crypto-events`) feeding a **3-Level Live Execution Trace Visualizer**.
   - Client-Side **AES-128 S-Box Sandbox** verified against NIST FIPS-197 Appendix B test vectors.

---

## 📚 Academic Research Foundations

PAPERWALL builds upon state-of-the-art research published in peer-reviewed journals:

- **Paper A**: *“Design and implementation of an authenticated post-quantum session protocol using ML-KEM (Kyber), ML-DSA (Dilithium), and AES-256-GCM”*  
  **Authors**: Akinlemi Olushola & S. P. Meenakshi (*Frontiers in Physics*, 2026) — [DOI: 10.3389/fphy.2025.1723966](https://doi.org/10.3389/fphy.2025.1723966)
- **Paper B**: *“Hybrid Quantum-Safe Cryptographic Scheme With Secure Key Exchange and Signature Scheme”*  
  **Authors**: Perera K. Maduni, Ilmu Byun, Jeongil Seo, & Kyeongjun Ko (*IEEE Access*, 2025) — [DOI: 10.1109/ACCESS.2025.3600068](https://doi.org/10.1109/ACCESS.2025.3600068)

---

## 🛠️ System Architecture

```
+-----------------------------------------------------------------------------------+
|                            PAPERWALL ARCHITECTURE                                 |
+-----------------------------------------------------------------------------------+
|  React 18 / TypeScript SPA <---> REST API / WSS <---> FastAPI Backend             |
|                                                          |                        |
|                                                          +---> PyCA Cryptography  |
|                                                          |     (ML-KEM / ML-DSA)  |
|                                                          |                        |
|                                                          +---> PostgreSQL (WSL)   |
|                                                          +---> Zero-Trust Engine  |
|                                                          +---> Provenance Chain   |
+-----------------------------------------------------------------------------------+
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+ and `npm`
- PostgreSQL 14+ (WSL Ubuntu or local service)

### 1. Database & Backend Setup
```bash
# Clone the repository
git clone https://github.com/anubhav20ch/PAPERWALL.git
cd PAPERWALL/backend

# Initialize virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run Alembic migrations & Seed default accounts
alembic upgrade head
python -m app.seed

# Start FastAPI Uvicorn Server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend React Setup
```bash
cd ../quantum-shield

# Install dependencies
npm install

# Start Vite Development Server
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🔑 Pre-Seeded Accounts for Testing

| Role | Email | Password | Access Rights |
|---|---|---|---|
| **Admin** | `admin@quantumshield.com` | `admin123` | Full system governance, policy creation, key rotation simulations |
| **Professor** | `a.turing@university.edu` | `prof123` | Upload papers, view provenance timeline, request downloads |
| **Exam Centre** | `centre.north@university.edu` | `centre123` | Access exam dashboard, download papers during active release windows |

---

## 🧪 Automated Testing

Execute the complete 26-test automated security suite:
```bash
cd backend
python -m pytest tests/ -v
```
All 26 unit and integration tests across Auth, Cryptography Core, Policies, Provenance, Exams, Threat, Simulations, and WebSockets return **100% PASSED**.

---

## 📄 Comprehensive Documentation

Detailed technical documents are available in the `docs/` folder:
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — System Architecture, ER Diagrams, Sequence Flows
- [`docs/CRYPTOGRAPHY.md`](docs/CRYPTOGRAPHY.md) — PQC Specifications & Primitive Mechanics
- [`docs/API.md`](docs/API.md) — REST API & WebSocket Telemetry Reference
- [`docs/SECURITY.md`](docs/SECURITY.md) — Threat Model & Capabilities Matrix
- [`docs/SETUP.md`](docs/SETUP.md) — Step-by-Step Developer Guide
- [`docs/PROJECT_REPORT.md`](docs/PROJECT_REPORT.md) — Full Academic & Governance Report

---

## 📜 License
Distributed under the **MIT License**. See `LICENSE` for more information.
