import pytest
import io
from app import models

def test_provenance_chain_creation(client, prof_headers):
    """Verifies provenance event chain entries are logged on paper upload."""
    files = {"file": ("prov_paper.pdf", io.BytesIO(b"%PDF-1.7 Provenance Chain Payload"), "application/pdf")}
    data = {"title": "Provenance Test Paper", "subject": "Crypto", "course_code": "PROV-101", "semester": "Fall 2026", "exam_date": "2026-11-15"}
    upload_res = client.post("/api/papers", data=data, files=files, headers=prof_headers)
    paper_id = upload_res.json()["id"]

    prov_res = client.get(f"/api/papers/{paper_id}/provenance", headers=prof_headers)
    assert prov_res.status_code == 200
    events = prov_res.json()
    assert len(events) >= 1
    assert events[0]["event_type"] == "Created"

    verify_res = client.get(f"/api/papers/{paper_id}/verify-provenance", headers=prof_headers)
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] == "AUTHENTIC"
    assert verify_res.json()["signature_status"] == "VALID"

def test_negative_provenance_tamper_detection(client, prof_headers, db_session):
    """Negative Test: Directly mutating a provenance event hash in DB causes chain verification to report broken/corrupt chain."""
    files = {"file": ("prov_tamper.pdf", io.BytesIO(b"%PDF-1.7 Provenance Tamper Test Payload"), "application/pdf")}
    data = {"title": "Provenance Tamper Paper", "subject": "Crypto", "course_code": "PROV-202", "semester": "Fall 2026", "exam_date": "2026-11-15"}
    upload_res = client.post("/api/papers", data=data, files=files, headers=prof_headers)
    paper_id = upload_res.json()["id"]

    # Trigger second event (download)
    client.get(f"/api/papers/{paper_id}/download", headers=prof_headers)

    # Mutate previous record hash in DB directly
    events = (
        db_session.query(models.ProvenanceEvent)
        .filter(models.ProvenanceEvent.paper_id == paper_id)
        .order_by(models.ProvenanceEvent.timestamp.asc())
        .all()
    )
    assert len(events) > 1
    events[1].prev_record_hash = "corrupted_previous_hash_00000000000000000000000000000000"
    db_session.commit()

    verify_res = client.get(f"/api/papers/{paper_id}/verify-provenance", headers=prof_headers)
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] == "TAMPERED_OR_CORRUPT"
    assert verify_res.json()["chain_status"] == "CHAIN_BROKEN"
