# QuantumShield System Architecture

QuantumShield is an enterprise-grade academic paper distribution platform engineered with post-quantum cryptography (PQC). It mitigates Harvest-Now-Decrypt-Later (HNDL) threats using NIST-standardized quantum-resistant algorithms alongside Zero-Trust fine-grained access control policy engines and immutable event provenance chains.

---

## 1. System Overview & Component Layout

```mermaid
graph TD
    Client[React/TypeScript SPA Frontend] -->|REST API / HTTPS| FastAPI[FastAPI Backend Server]
    Client -->|WebSocket / WSS| WS[WebSocket Event Manager]
    FastAPI -->|PyCA Cryptography v50.0.1| Crypto[Crypto Engine]
    FastAPI -->|SQLAlchemy ORM| DB[(PostgreSQL Database)]
    Crypto -->|Persisted Seeds| SeedFiles[ML-KEM & ML-DSA Seed Files]
    WS -->|Live Telemetry| Visualizer[Crypto Execution Visualizer]
```

### Frontend Architecture (`quantum-shield/src/`)
- **UI Framework**: React 18 + TypeScript built with Vite.
- **Styling**: Tailwind CSS with custom dark mode themes and glassmorphic UI cards.
- **Routing**: React Router v6 with AuthGuard wrappers.
- **Interactive Visualizers**:
  - `CryptoVisualizer.tsx`: 3-level live execution trace (Overview Feed, Animated Pipeline Flow Diagram, Technical Microsecond Telemetry).
  - `AESSandbox.tsx`: Interactive client-side AES-128 round-by-round visualizer verified against NIST FIPS-197 Appendix B.
  - `AccessPolicies.tsx`: Zero-trust access policy editor with role, time-window, and quota enforcement.
  - `ExamDashboard.tsx`: High-security examination state machine controller (`created` → `locked` → `released` → `closed`).
  - `ThreatCenter.tsx`: Dynamic threat dashboard featuring behavior profiles, anomaly scores, and key compromise dry-run blast radius simulation.

### Backend Architecture (`backend/app/`)
- **API Engine**: FastAPI running on Python 3.14 / Uvicorn.
- **Database**: PostgreSQL hosted on WSL Ubuntu, managed via SQLAlchemy ORM and Alembic migrations.
- **Security & Auth**: OAuth2 Password bearer flow using JWT tokens (`HS256`) and `bcrypt` password hashing. `slowapi` rate-limiting protects `/api/login` (10 requests/min).
- **Crypto Engine (`crypto_helpers.py`)**: Uses PyCA `cryptography` v50.0.1 for native C-bindings of FIPS-standard PQC primitives.

---

## 2. Cryptographic Execution Flow

```mermaid
sequenceDiagram
    autonumber
    actor Prof as Professor / Admin
    participant Server as FastAPI Router
    participant Core as Crypto Engine (crypto_helpers.py)
    participant DB as PostgreSQL DB

    Prof->>Server: POST /api/papers (PDF payload)
    Server->>Core: encrypt_and_sign_document(paper_id, file_bytes)
    Core->>Core: Generate 256-bit AES DEK
    Core->>Core: AES-256-GCM Encrypt Document
    Core->>Core: SHA3-256 Digest Computation
    Core->>Core: ML-DSA-65 (Dilithium) Sign SHA3 Digest
    Core->>Core: ML-KEM-768 (Kyber) Encapsulate AES DEK
    Core-->>Server: Return encrypted file path, signatures, ciphertext
    Server->>DB: Save Paper Record & Initial Provenance Event ("Created")
    Server-->>Prof: Return Paper Metadata & Quantum Seal
```

---

## 3. Database Schema & Data Models

```mermaid
erDiagram
    users ||--o{ papers : "uploads"
    users ||--o{ security_incidents : "triggers"
    papers ||--o{ access_policies : "gated by"
    papers ||--o{ provenance_events : "tracks"
    papers ||--o{ key_rotations : "audits"
    papers ||--o| exams : "assigned to"

    users {
        int id PK
        string email UK
        string hashed_password
        int role_id
        boolean is_active
    }

    papers {
        string id PK
        string title
        string subject
        string course_code
        string file_path
        string sha3_hash
        string dilithium_signature
        string kyber_public_key
        string encryption_status
        string verification_status
    }

    access_policies {
        int id PK
        string paper_id FK
        string name
        int required_role
        datetime valid_from
        datetime valid_until
        int max_downloads
        int current_downloads
    }

    provenance_events {
        int id PK
        string paper_id FK
        string event_type
        string actor
        string prev_record_hash
        string payload_hash
        string signature
        boolean verified
    }
```

---

## 4. Key Security Boundaries
1. **Zero Raw Secret Key Exposure**: Server private seeds (`server_mldsa_seed.bin` and `system_mlkem_seed.bin`) remain locked on backend disk; raw secret key bytes are never sent in API responses or WebSocket broadcasts.
2. **Gated Key Release**: Decryption keys are NEVER stored static on disk. AES DEKs exist only as ephemeral encapsulated keypairs inside `ML-KEM-768` ciphertexts, decapsulated only when policy engines authorize release.
3. **Immutable Provenance Chains**: Every paper modification or download registers a SHA3-linked `ProvenanceEvent` record, preventing non-repudiable audit tampering.
