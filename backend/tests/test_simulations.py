import pytest
import io
from app import models

def create_test_paper(client, admin_headers, title="Sim Test Paper"):
    files = {"file": ("sim_paper.pdf", io.BytesIO(b"%PDF-1.7 Sim Test Payload"), "application/pdf")}
    data = {"title": title, "subject": "Sim", "course_code": "SIM-101", "semester": "Fall 2026", "exam_date": "2026-11-15"}
    res = client.post("/api/papers", data=data, files=files, headers=admin_headers)
    return res.json()["id"]

def test_dry_run_key_compromise_non_mutating(client, admin_headers, db_session):
    """Verifies dry-run simulation calculates blast radius without mutating database records."""
    paper_id = create_test_paper(client, admin_headers)
    count_before = db_session.query(models.Paper).count()

    sim_res = client.post(
        "/api/simulations/key-compromise",
        json={"paper_id": paper_id, "compromise_type": "NODE_BREACH"},
        headers=admin_headers
    )
    assert sim_res.status_code == 200
    report = sim_res.json()
    assert report["total_affected_papers"] == 1
    assert "recommended_actions" in report

    count_after = db_session.query(models.Paper).count()
    assert count_before == count_after

def test_live_key_rotation(client, admin_headers, db_session):
    """Verifies live key rotation re-signs target paper with new signature and logs key rotation entry."""
    paper_id = create_test_paper(client, admin_headers, title="Key Rotation Target Paper")

    # Fetch original signature
    p1 = db_session.query(models.Paper).filter(models.Paper.id == paper_id).first()
    old_sig = p1.dilithium_signature

    rot_res = client.post(
        f"/api/simulations/rotate-key/{paper_id}",
        json={"reason": "Test Key Rotation"},
        headers=admin_headers
    )
    assert rot_res.status_code == 200
    assert rot_res.json()["status"] == "SUCCESS"

    db_session.refresh(p1)
    new_sig = p1.dilithium_signature
    assert old_sig != new_sig

    # Verify KeyRotation audit log exists
    rot_log = db_session.query(models.KeyRotation).filter(models.KeyRotation.paper_id == paper_id).first()
    assert rot_log is not None
    assert rot_log.rotated_by == "admin@quantumshield.com"
