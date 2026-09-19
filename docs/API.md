# QuantumShield REST & WebSocket API Specification

## Base URL
- **HTTP / REST**: `http://localhost:8000/api`
- **WebSocket**: `ws://localhost:8000/ws`

---

## 1. Authentication Endpoints

### `POST /api/login`
- **Description**: Authenticates user via OAuth2 Form Credentials and returns a JWT token.
- **Rate Limit**: 10 requests per minute (`slowapi`).
- **Request Body** (`application/x-www-form-urlencoded`):
  - `username` (string): User email address.
  - `password` (string): User password.
- **Response** (`200 OK`):
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1Ni...",
    "token_type": "bearer",
    "role": "Admin",
    "role_id": 1,
    "email": "admin@quantumshield.com"
  }
  ```

### `GET /api/me`
- **Description**: Retrieves current authenticated user profile.
- **Headers**: `Authorization: Bearer <JWT>`
- **Response** (`200 OK`):
  ```json
  {
    "id": 1,
    "email": "admin@quantumshield.com",
    "role_id": 1,
    "role_name": "Admin",
    "is_active": true
  }
  ```

---

## 2. Paper Management Endpoints

### `POST /api/papers`
- **Description**: Uploads a paper, executes PQC encryption (AES-256-GCM + ML-KEM-768), signs with ML-DSA-65, and registers initial provenance event.
- **Headers**: `Authorization: Bearer <JWT>`
- **Request Body** (`multipart/form-data`):
  - `title` (string, required)
  - `subject` (string, required)
  - `course_code` (string, required)
  - `semester` (string, required)
  - `exam_date` (string, required, YYYY-MM-DD)
  - `exam_time` (string, optional, HH:MM, default: "09:00")
  - `file` (binary PDF, required)
- **Response** (`200 OK`):
  ```json
  {
    "id": "P-2026-104",
    "title": "Quantum Information Theory",
    "subject": "Physics",
    "course_code": "PHYS-401",
    "semester": "Fall 2026",
    "exam_date": "2026-11-20",
    "sha3_hash": "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
    "dilithium_signature": "aW52YWxpZF9zaWduYXR1cmU...",
    "kyber_public_key": "a3Y4ZXJfYnl0ZXNfcHVibGlj...",
    "encryption_status": "Encrypted",
    "verification_status": "Secured"
  }
  ```

### `GET /api/papers/{paper_id}/download`
- **Description**: Evaluates access policy & exam locks, decapsulates DEK, decrypts payload, verifies signature/digest, and streams raw PDF bytes.
- **Headers**: `Authorization: Bearer <JWT>`
- **Response** (`200 OK`): Binary `application/pdf` stream.
- **Error Responses**:
  - `403 Forbidden`: Policy evaluation denial or Exam Lock enforced.

---

## 3. Access Policy Endpoints

### `POST /api/policies`
- **Description**: Creates a fine-grained zero-trust access policy for a paper.
- **Headers**: `Authorization: Bearer <JWT>` (Admin only)
- **Request Body**:
  ```json
  {
    "paper_id": "P-2026-104",
    "name": "Midterm Exam Release Policy",
    "required_role": 3,
    "valid_from": "2026-11-20T08:30:00Z",
    "valid_until": "2026-11-20T12:00:00Z",
    "max_downloads": 5,
    "require_signature_verification": true,
    "require_integrity_verification": true
  }
  ```

---

## 4. Provenance & Chain Verification Endpoints

### `GET /api/papers/{paper_id}/provenance`
- **Description**: Returns ordered list of immutable provenance events for a paper.

### `GET /api/papers/{paper_id}/verify-provenance`
- **Description**: Validates signature, file digest, and provenance chain linkage integrity.
- **Response** (`200 OK`):
  ```json
  {
    "status": "AUTHENTIC",
    "expected_sha3": "a591a6d40bf42...",
    "actual_sha3": "a591a6d40bf42...",
    "signature_status": "VALID",
    "chain_status": "INTACT",
    "events_count": 2
  }
  ```

---

## 5. Exam State Control & Threat Endpoints

### `PATCH /api/exams/{exam_id}/transition`
- **Description**: Transitions exam state machine (`created` → `locked` → `released` → `closed`).

### `POST /api/simulations/key-compromise`
- **Description**: Performs non-mutating dry-run blast radius impact report for compromised key seeds.

### `POST /api/simulations/rotate-key/{paper_id}`
- **Description**: Performs live key rotation for target paper, re-signing payload with new ML-DSA seed.

---

## 6. WebSocket Cryptographic Telemetry

### `WS /ws/crypto-events?token=<JWT>`
- **Description**: Authenticated WebSocket stream broadcasting real-time execution trace metrics.
- **Message Format**:
  ```json
  {
    "event": "crypto_op",
    "paper_id": "P-2026-104",
    "op_type": "Sign",
    "algorithm": "ML-DSA-65",
    "duration_ms": 1.42,
    "status": "SUCCESS",
    "actor": "admin@quantumshield.com",
    "timestamp": "2026-09-19T17:00:00Z"
  }
  ```
