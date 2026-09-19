# QuantumShield Security Architecture & Threat Model

QuantumShield is designed under a Zero-Trust security model specifically tailored for post-quantum academic paper distribution.

---

## 1. Protected Security Properties

### 1. Quantum Resistance against HNDL (Harvest-Now-Decrypt-Later)
- **Mitigation**: All document symmetric Data Encryption Keys (DEKs) are encapsulated using **ML-KEM-768 (NIST FIPS 203)** key agreement.
- **Guarantee**: Adversaries capturing encrypted network traffic or database dumps today cannot decrypt document contents in the future, even with access to a Cryptographically Relevant Quantum Computer (CRQC).

### 2. Distributor Non-Repudiation & Document Integrity
- **Mitigation**: Documents are signed at rest using **ML-DSA-65 (NIST FIPS 204)** over a **SHA3-256 (FIPS 202)** integrity hash.
- **Guarantee**: Any byte-level modification to stored ciphertexts or metadata renders the digital signature invalid and halts decryption prior to key release.

### 3. Audit Non-Repudiation (Immutable Provenance Chains)
- **Mitigation**: Provenance events (`Created`, `Downloaded`, `KeyRotated`) maintain a cryptographic hash-link chain where `prev_record_hash = SHA3-256(previous_event_payload)`.
- **Guarantee**: Database administrators or malicious insiders cannot alter or delete past access logs without breaking provenance chain verification.

### 4. Policy & Examination Gated Key Release
- **Mitigation**: Ephemeral AES DEKs are decapsulated only when both the zero-trust policy engine (`evaluate_paper_policies`) and exam state machine (`released` state check) grant authorization.
- **Guarantee**: Prevents early leakages of sensitive exam papers before scheduled examination start times.

### 5. Brute Force Protection & Credential Hardening
- **Mitigation**: Password hashes stored via `bcrypt`. Authentication endpoints protected by `slowapi` rate-limiting (10 requests/minute per IP).
- **Guarantee**: Prevents credential stuffing and automated password guessing attacks.

---

## 2. Explicit Out-of-Scope Non-Goals & Limitations

1. **Client Endpoint Screen Capture**: Once a PDF document is decrypted and rendered in a user's browser, physical screen capture or external camera photography is out of scope.
2. **Physical Side-Channel Attacks (DPA/SPA)**: Differential Power Analysis on host RAM/CPU executing ML-KEM or AES primitives is outside software scope.
3. **Infrastructure-Level DDoS / BGP Hijacking**: Network-layer volumetric DDoS protection is expected to be handled by edge WAF / reverse proxy infrastructure (e.g. Cloudflare / AWS Shield).
