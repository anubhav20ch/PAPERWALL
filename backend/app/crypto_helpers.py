import os
import base64
import time
import hashlib
from typing import Tuple, Dict, Any
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.asymmetric import mlkem, mldsa
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from .config import STORAGE_DIR

MLDSA_SEED_PATH = os.path.join(STORAGE_DIR, "server_mldsa_seed.bin")
MLKEM_SEED_PATH = os.path.join(STORAGE_DIR, "system_mlkem_seed.bin")

def _init_keys():
    os.makedirs(STORAGE_DIR, exist_ok=True)
    if os.path.exists(MLDSA_SEED_PATH):
        with open(MLDSA_SEED_PATH, "rb") as f:
            mldsa_seed = f.read()
    else:
        mldsa_seed = os.urandom(32)
        with open(MLDSA_SEED_PATH, "wb") as f:
            f.write(mldsa_seed)

    if os.path.exists(MLKEM_SEED_PATH):
        with open(MLKEM_SEED_PATH, "rb") as f:
            mlkem_seed = f.read()
    else:
        mlkem_seed = os.urandom(64)
        with open(MLKEM_SEED_PATH, "wb") as f:
            f.write(mlkem_seed)

    server_mldsa = mldsa.MLDSA65PrivateKey.from_seed_bytes(mldsa_seed)
    system_mlkem = mlkem.MLKEM768PrivateKey.from_seed_bytes(mlkem_seed)

    return server_mldsa, system_mlkem

_SERVER_MLDSA_KEY, _SYSTEM_MLKEM_KEY = _init_keys()

def get_server_mldsa_public_key() -> mldsa.MLDSA65PublicKey:
    return _SERVER_MLDSA_KEY.public_key()

def sign_sha3_digest(sha3_hex: str) -> str:
    sig_bytes = _SERVER_MLDSA_KEY.sign(sha3_hex.encode('utf-8'))
    return base64.b64encode(sig_bytes).decode('utf-8')

def get_system_mlkem_private_key() -> mlkem.MLKEM768PrivateKey:
    return _SYSTEM_MLKEM_KEY

def get_system_mlkem_public_key() -> mlkem.MLKEM768PublicKey:
    return _SYSTEM_MLKEM_KEY.public_key()

def encrypt_and_sign_document(paper_id: str, plaintext_bytes: bytes) -> Dict[str, Any]:
    """
    Real Cryptographic Workflow:
    1. Generate 256-bit AES DEK (Document Encryption Key) and random 96-bit nonce.
    2. Encrypt plaintext payload with AES-256-GCM.
    3. Generate SHA3-256 digest of plaintext payload.
    4. Sign SHA3-256 hash using ML-DSA-65 (Dilithium) server distributor key.
    5. Encapsulate AES DEK using ML-KEM-768 (Kyber) system public key.
    6. Derive envelope key using HKDF-SHA3-256 and encrypt DEK.
    7. Save encrypted payload (nonce + ciphertext + KEM envelope) to storage.
    """
    t_start = time.perf_counter()

    # Step 1: AES DEK & Nonce
    t_aes_start = time.perf_counter()
    aes_dek = AESGCM.generate_key(bit_length=256)
    aes_nonce = os.urandom(12)
    aesgcm = AESGCM(aes_dek)
    ciphertext = aesgcm.encrypt(aes_nonce, plaintext_bytes, None)
    t_aes_end = time.perf_counter()

    # Step 2: SHA3-256 Digest
    t_sha3_start = time.perf_counter()
    sha3_digest = hashlib.sha3_256(plaintext_bytes).hexdigest()
    t_sha3_end = time.perf_counter()

    # Step 3: ML-DSA-65 Signature
    t_dsa_start = time.perf_counter()
    signature_bytes = _SERVER_MLDSA_KEY.sign(sha3_digest.encode('utf-8'))
    t_dsa_end = time.perf_counter()

    # Step 4: ML-KEM-768 Encapsulation
    t_kem_start = time.perf_counter()
    system_pub_kem = get_system_mlkem_public_key()
    shared_secret, kem_ciphertext = system_pub_kem.encapsulate()
    t_kem_end = time.perf_counter()

    # Step 5: HKDF-SHA3-256 Key Derivation & DEK Wrap
    hkdf = HKDF(
        algorithm=hashes.SHA3_256(),
        length=32,
        salt=None,
        info=b"quantum-shield-key-envelope",
    )
    derived_envelope_key = hkdf.derive(shared_secret)
    env_nonce = os.urandom(12)
    wrapped_dek = AESGCM(derived_envelope_key).encrypt(env_nonce, aes_dek, None)

    # Save payload package to storage directory:
    # Format: [12-byte env_nonce][12-byte aes_nonce][2-byte kem_ct_len][kem_ciphertext][2-byte wrapped_dek_len][wrapped_dek][ciphertext]
    file_path = os.path.join(STORAGE_DIR, f"{paper_id}.qs")
    with open(file_path, "wb") as f:
        f.write(env_nonce)
        f.write(aes_nonce)
        f.write(len(kem_ciphertext).to_bytes(2, "big"))
        f.write(kem_ciphertext)
        f.write(len(wrapped_dek).to_bytes(2, "big"))
        f.write(wrapped_dek)
        f.write(ciphertext)

    t_total_end = time.perf_counter()

    # Encode public metadata for API response
    kyber_pub_bytes = system_pub_kem.public_bytes_raw()
    
    return {
        "paper_id": paper_id,
        "file_path": file_path,
        "sha3_hash": sha3_digest,
        "dilithium_signature": base64.b64encode(signature_bytes).decode("utf-8"),
        "kyber_public_key": base64.b64encode(kyber_pub_bytes).decode("utf-8"),
        "timings": {
            "aes_encrypt_us": (t_aes_end - t_aes_start) * 1_000_000,
            "sha3_hash_us": (t_sha3_end - t_sha3_start) * 1_000_000,
            "dsa_sign_us": (t_dsa_end - t_dsa_start) * 1_000_000,
            "kem_encap_us": (t_kem_end - t_kem_start) * 1_000_000,
            "total_ms": (t_total_end - t_start) * 1000,
        }
    }


def verify_and_decrypt_document(file_path: str, expected_sha3: str, signature_b64: str) -> Tuple[bytes, Dict[str, float]]:
    """
    Real Cryptographic Decryption & Verification Workflow:
    1. Read payload package from storage.
    2. Verify ML-DSA signature over SHA3 hash.
    3. Perform ML-KEM decapsulation to recover shared secret.
    4. Derive envelope key using HKDF-SHA3-256 and unwrap AES DEK.
    5. Decrypt document payload using AES-256-GCM.
    6. Verify decrypted SHA3 hash matches expected hash.
    """
    t_start = time.perf_counter()

    if not os.path.exists(file_path):
        raise FileNotFoundError("Encrypted document payload package not found on server storage.")

    with open(file_path, "rb") as f:
        file_data = f.read()

    env_nonce = file_data[0:12]
    aes_nonce = file_data[12:24]
    kem_ct_len = int.from_bytes(file_data[24:26], "big")
    offset = 26
    kem_ciphertext = file_data[offset:offset + kem_ct_len]
    offset += kem_ct_len
    wrapped_dek_len = int.from_bytes(file_data[offset:offset + 2], "big")
    offset += 2
    wrapped_dek = file_data[offset:offset + wrapped_dek_len]
    offset += wrapped_dek_len
    ciphertext = file_data[offset:]

    # Step 1: Verify ML-DSA Signature
    t_dsa_start = time.perf_counter()
    signature_bytes = base64.b64decode(signature_b64)
    server_mldsa_pub = get_server_mldsa_public_key()
    server_mldsa_pub.verify(signature_bytes, expected_sha3.encode('utf-8'))
    t_dsa_end = time.perf_counter()

    # Step 2: ML-KEM-768 Decapsulation
    t_kem_start = time.perf_counter()
    system_mlkem_priv = get_system_mlkem_private_key()
    shared_secret = system_mlkem_priv.decapsulate(kem_ciphertext)
    t_kem_end = time.perf_counter()

    # Step 3: HKDF-SHA3-256 Key Derivation & DEK Unwrap
    t_aes_start = time.perf_counter()
    hkdf = HKDF(
        algorithm=hashes.SHA3_256(),
        length=32,
        salt=None,
        info=b"quantum-shield-key-envelope",
    )
    derived_envelope_key = hkdf.derive(shared_secret)
    aes_dek = AESGCM(derived_envelope_key).decrypt(env_nonce, wrapped_dek, None)

    # Step 4: AES-256-GCM Payload Decryption
    decrypted_bytes = AESGCM(aes_dek).decrypt(aes_nonce, ciphertext, None)
    t_aes_end = time.perf_counter()

    # Step 5: Verify SHA3 Digest Integrity
    t_sha3_start = time.perf_counter()
    computed_sha3 = hashlib.sha3_256(decrypted_bytes).hexdigest()
    t_sha3_end = time.perf_counter()

    if computed_sha3 != expected_sha3:
        raise ValueError(f"Integrity Mismatch: Computed SHA3 ({computed_sha3[:8]}...) != Expected SHA3 ({expected_sha3[:8]}...)")

    t_total_end = time.perf_counter()

    timings = {
        "dsa_verify_us": (t_dsa_end - t_dsa_start) * 1_000_000,
        "kem_decap_us": (t_kem_end - t_kem_start) * 1_000_000,
        "aes_decrypt_us": (t_aes_end - t_aes_start) * 1_000_000,
        "sha3_hash_us": (t_sha3_end - t_sha3_start) * 1_000_000,
        "total_ms": (t_total_end - t_start) * 1000,
    }

    return decrypted_bytes, timings
