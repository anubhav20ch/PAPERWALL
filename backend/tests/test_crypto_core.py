import pytest
import os
import hashlib
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.asymmetric import mlkem, mldsa
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from app import crypto_helpers

def test_aes_256_gcm_roundtrip_and_tamper_detection():
    """AES-256-GCM encrypt/decrypt roundtrip and authentication tag failure on tampered ciphertext."""
    plaintext = b"Confidential Examination Paper 2026 - Secret Questions"
    key = AESGCM.generate_key(bit_length=256)
    nonce = os.urandom(12)

    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(nonce, plaintext, None)
    assert len(ciphertext) > len(plaintext)

    # Decrypt happy path
    decrypted = aesgcm.decrypt(nonce, ciphertext, None)
    assert decrypted == plaintext

    # Tamper test: flip a single byte in ciphertext
    tampered = bytearray(ciphertext)
    tampered[5] ^= 0xFF
    with pytest.raises(Exception):
        aesgcm.decrypt(nonce, bytes(tampered), None)

def test_sha3_256_determinism_and_tamper_detection():
    """SHA3-256 hash digest determinism and tamper detection."""
    data1 = b"Original Examination Document"
    data2 = b"Original Examination Document"
    tampered_data = b"Original Examination Document!"

    h1 = hashlib.sha3_256(data1).hexdigest()
    h2 = hashlib.sha3_256(data2).hexdigest()
    h_tampered = hashlib.sha3_256(tampered_data).hexdigest()

    assert h1 == h2
    assert len(h1) == 64
    assert h1 != h_tampered

def test_mlkem_768_encap_decap_and_wrong_key_failure():
    """ML-KEM-768 key encapsulation/decapsulation roundtrip and implicit rejection on corrupted ciphertext (FIPS 203)."""
    system_key = crypto_helpers.get_system_mlkem_private_key()
    pub_key = system_key.public_key()

    shared_secret_sender, ciphertext = pub_key.encapsulate()
    assert len(shared_secret_sender) == 32
    assert len(ciphertext) > 0

    # Decapsulate happy path
    shared_secret_receiver = system_key.decapsulate(ciphertext)
    assert shared_secret_sender == shared_secret_receiver

    # Corrupted ciphertext test (FIPS 203 Implicit Rejection)
    corrupted_ct = bytearray(ciphertext)
    corrupted_ct[10] ^= 0xFF
    rejection_secret = system_key.decapsulate(bytes(corrupted_ct))
    assert rejection_secret != shared_secret_sender

def test_mldsa_65_sign_verify_and_tamper_rejection():
    """ML-DSA-65 digital signature generation, verification, and tamper rejection."""
    pub_key = crypto_helpers.get_server_mldsa_public_key()
    msg_digest = hashlib.sha3_256(b"Test Paper Payload Digest").hexdigest()

    signature_b64 = crypto_helpers.sign_sha3_digest(msg_digest)
    sig_bytes = base64.b64decode(signature_b64)

    # Verify happy path
    pub_key.verify(sig_bytes, msg_digest.encode('utf-8'))

    # Negative test 1: Tampered message digest
    tampered_digest = hashlib.sha3_256(b"Tampered Paper Payload Digest").hexdigest()
    with pytest.raises(Exception):
        pub_key.verify(sig_bytes, tampered_digest.encode('utf-8'))

    # Negative test 2: Tampered signature bytes
    corrupted_sig = bytearray(sig_bytes)
    corrupted_sig[20] ^= 0xFF
    with pytest.raises(Exception):
        pub_key.verify(bytes(corrupted_sig), msg_digest.encode('utf-8'))

def test_hkdf_sha3_256_determinism():
    """HKDF-SHA3-256 key derivation determinism."""
    secret = b"shared-secret-32-bytes-long-123456"
    info = b"quantum-shield-key-envelope"

    def derive():
        return HKDF(
            algorithm=hashes.SHA3_256(),
            length=32,
            salt=None,
            info=info,
        ).derive(secret)

    k1 = derive()
    k2 = derive()
    assert len(k1) == 32
    assert k1 == k2
