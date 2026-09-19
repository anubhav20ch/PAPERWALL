# QuantumShield Cryptographic Architecture & Primitive Specifications

QuantumShield provides quantum-resistant protection for high-value academic papers and examination materials. It combines NIST Post-Quantum Cryptography (PQC) standards with symmetric authenticated encryption and cryptographically linked provenance chains.

---

## 1. Cryptographic Primitive Specifications

| Primitive | Standard / Variant | Security Category / Bit Strength | Primary Usage in QuantumShield |
|---|---|---|---|
| **AES-256-GCM** | NIST SP 800-38D | 256-bit Symmetric Security | Authenticated payload encryption of PDF documents |
| **SHA3-256** | FIPS 202 | 128-bit Collision / 256-bit Pre-image | Document integrity digest & provenance chain hashing |
| **ML-KEM-768** | NIST FIPS 203 (Kyber768) | Category 3 (AES-192 equivalent) | Key Encapsulation Mechanism (KEM) wrapping AES DEKs |
| **ML-DSA-65** | NIST FIPS 204 (Dilithium3) | Category 3 (AES-192 equivalent) | Digital signature for distributor non-repudiation |
| **HKDF-SHA3-256** | RFC 5869 / SHA3-256 | 256-bit Key Derivation | Sub-key derivation and key envelope binding |

---

## 2. Post-Quantum Cryptography Rationale

### Threat Model: Harvest-Now-Decrypt-Later (HNDL)
Traditional public-key cryptosystems (RSA, ECDSA, ECDH) rely on the integer factorization and discrete logarithm problems. These mathematical problems are vulnerable to **Shor's Algorithm** executing on future Cryptographically Relevant Quantum Computers (CRQCs).

Adversaries are actively capturing and storing encrypted sensitive academic exams today with the intent to decrypt them once CRQCs emerge.

### NIST FIPS Standard Adherence
- **NIST FIPS 203 (ML-KEM)**: Based on the Hardness of Learning With Errors over Module Lattices (M-LWE). ML-KEM-768 provides a 768-dimensional module rank balancing performance and security.
- **NIST FIPS 204 (ML-DSA)**: Based on the Fiat-Shamir with Aborts paradigm over Module Lattices (M-SIS). Provides strong existential unforgeability under chosen message attacks (EUF-CMA).

### Implicit Rejection in ML-KEM-768
Unlike RSA or ECC, decapsulating a corrupted ML-KEM ciphertext does **not** raise a runtime exception. Instead, ML-KEM-768 implements **implicit rejection**: it deterministically derives a pseudo-random, mismatched shared key. Downstream AES-256-GCM tag verification subsequently fails, preventing side-channel key-oracle leakages.

---

## 3. End-to-End Cryptographic Pipeline (`crypto_helpers.py`)

### 1. Document Encryption & Signing Flow (`encrypt_and_sign_document`)
```python
def encrypt_and_sign_document(paper_id: str, raw_pdf_bytes: bytes) -> dict:
```
1. **DEK Generation**: Generates a random 256-bit (32-byte) AES Data Encryption Key (`dek`).
2. **AES-256-GCM Encryption**: Encrypts `raw_pdf_bytes` using a random 96-bit (12-byte) IV. Output: `iv + ciphertext + tag` (written to disk under `backend/storage/encrypted/`).
3. **SHA3-256 Digest**: Computes `sha3_256(raw_pdf_bytes)`.
4. **ML-DSA-65 Digital Signature**: Signs the SHA3-256 string using the server's persisted Dilithium private key (`server_mldsa_seed.bin`).
5. **ML-KEM-768 Key Encapsulation**: Encapsulates `dek` using the recipient's or system Kyber public key (`system_mlkem_seed.bin`), returning `kem_ciphertext` and `shared_secret`.
6. **Key Wrapping**: Derives wrapping key `wrap_key = HKDF-SHA3-256(shared_secret)` and encrypts `dek`.

### 2. Verification & Decryption Flow (`verify_and_decrypt_document`)
```python
def verify_and_decrypt_document(file_path: str, expected_sha3: str, expected_signature: str) -> tuple[bytes, dict]:
```
1. **ML-DSA-65 Signature Verification**: Validates `expected_signature` against `expected_sha3` using `server_mldsa.verify()`.
2. **ML-KEM-768 Decapsulation**: Decapsulates stored `kem_ciphertext` to recover `shared_secret` and unwrap the AES DEK.
3. **AES-256-GCM Decryption**: Decrypts payload from `file_path` using recovered DEK and IV.
4. **SHA3-256 Integrity Validation**: Computes SHA3-256 digest of decrypted bytes and asserts exact byte-for-byte equality with `expected_sha3`.

---

## 4. Key Management & Seed Persistence
- Private keys are generated from deterministic 32-byte / 64-byte seed files stored locally:
  - `backend/server_mldsa_seed.bin` (32-byte seed for ML-DSA-65 signature keypair)
  - `backend/system_mlkem_seed.bin` (64-byte seed for ML-KEM-768 keypair)
- On server startup, `crypto_helpers.py` invokes `MLDSA65.from_seed_bytes()` and `MLKEM768.from_seed_bytes()`, guaranteeing key stability across process restarts.
