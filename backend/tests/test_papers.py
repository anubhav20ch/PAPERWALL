import pytest
import io
from app import models, crypto_helpers

def test_paper_upload_and_download_roundtrip(client, prof_headers):
    """Verifies paper upload and download decrypted payload matches original bytes exactly."""
    original_content = b"%PDF-1.7 Confidential Exam Content 2026 Exact Byte Match Verification"
    files = {"file": ("test_paper.pdf", io.BytesIO(original_content), "application/pdf")}
    data = {
        "title": "Quantum Cryptography Exam",
        "subject": "Computer Science",
        "course_code": "CS-701",
        "semester": "Fall 2026",
        "exam_date": "2026-11-15",
        "exam_time": "09:00"
    }

    # 1. Upload
    upload_res = client.post("/api/papers", data=data, files=files, headers=prof_headers)
    assert upload_res.status_code == 200
    paper = upload_res.json()
    paper_id = paper["id"]
    assert paper["sha3_hash"] is not None
    assert paper["dilithium_signature"] is not None

    # 2. Download
    download_res = client.get(f"/api/papers/{paper_id}/download", headers=prof_headers)
    assert download_res.status_code == 200
    assert download_res.content == original_content

def test_paper_tampered_signature_rejection(client, prof_headers, db_session):
    """Negative Test: Corrupting dilithium signature in DB causes download rejection."""
    original_content = b"%PDF-1.7 Paper For Signature Tamper Test"
    files = {"file": ("sig_tamper.pdf", io.BytesIO(original_content), "application/pdf")}
    data = {
        "title": "Signature Tamper Paper",
        "subject": "Security",
        "course_code": "SEC-801",
        "semester": "Fall 2026",
        "exam_date": "2026-11-15"
    }

    upload_res = client.post("/api/papers", data=data, files=files, headers=prof_headers)
    paper_id = upload_res.json()["id"]

    # Mutate signature in DB directly
    db_paper = db_session.query(models.Paper).filter(models.Paper.id == paper_id).first()
    # Substitute valid signature with random fake signature bytes
    db_paper.dilithium_signature = "aW52YWxpZF9zaWduYXR1cmVfYnl0ZXNfZm9yX3Rlc3RpbmdfcG9zdF9xdWFudHVt"
    db_session.commit()

    # Attempt download
    download_res = client.get(f"/api/papers/{paper_id}/download", headers=prof_headers)
    assert download_res.status_code in [400, 403]
    assert "verification failure" in download_res.json()["detail"].lower() or "denied" in download_res.json()["detail"].lower()
