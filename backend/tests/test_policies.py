import pytest
import io
import datetime
from app import models

def create_sample_paper(client, prof_headers):
    files = {"file": ("policy_paper.pdf", io.BytesIO(b"%PDF-1.7 Policy Test Content"), "application/pdf")}
    data = {"title": "Policy Test Paper", "subject": "Crypto", "course_code": "CY-101", "semester": "Fall 2026", "exam_date": "2026-11-15"}
    res = client.post("/api/papers", data=data, files=files, headers=prof_headers)
    return res.json()["id"]

def test_policy_grant_and_quota_decrement(client, admin_headers, prof_headers, db_session):
    """Verifies access is granted when policy rules pass, and quota decrements per download."""
    paper_id = create_sample_paper(client, prof_headers)

    # Create policy with max 2 downloads
    policy_data = {
        "paper_id": paper_id,
        "name": "Standard Quota Policy",
        "max_downloads": 2,
        "require_signature_verification": True,
        "require_integrity_verification": True
    }
    client.post("/api/policies", json=policy_data, headers=admin_headers)

    # First Download (Quota 0/2 -> 1/2)
    res1 = client.get(f"/api/papers/{paper_id}/download", headers=prof_headers)
    assert res1.status_code == 200

    policy = db_session.query(models.AccessPolicy).filter(models.AccessPolicy.paper_id == paper_id).first()
    assert policy.current_downloads == 1

def test_negative_policy_denied_time_window_expired(client, admin_headers, prof_headers):
    """Negative Test 1: Denied when access window is expired."""
    paper_id = create_sample_paper(client, prof_headers)
    past_time = (datetime.datetime.utcnow() - datetime.timedelta(days=1)).isoformat()

    policy_data = {
        "paper_id": paper_id,
        "name": "Expired Window Policy",
        "valid_until": past_time,
        "max_downloads": 5
    }
    client.post("/api/policies", json=policy_data, headers=admin_headers)

    res = client.get(f"/api/papers/{paper_id}/download", headers=prof_headers)
    assert res.status_code == 403
    assert "ACCESS DENIED" in res.json()["detail"]

def test_negative_policy_denied_unauthorized_role(client, admin_headers, centre_headers, prof_headers):
    """Negative Test 2: Denied when user role does not match policy required role."""
    paper_id = create_sample_paper(client, prof_headers)

    policy_data = {
        "paper_id": paper_id,
        "name": "Admin Only Policy",
        "required_role": 1,  # Admin only
        "max_downloads": 5
    }
    client.post("/api/policies", json=policy_data, headers=admin_headers)

    # Exam centre user (role 3) attempts download
    res = client.get(f"/api/papers/{paper_id}/download", headers=centre_headers)
    assert res.status_code == 403
    assert "ACCESS DENIED" in res.json()["detail"]

def test_negative_policy_denied_quota_exhausted(client, admin_headers, prof_headers):
    """Negative Test 3: Denied when download quota is exhausted (0 remaining)."""
    paper_id = create_sample_paper(client, prof_headers)

    policy_data = {
        "paper_id": paper_id,
        "name": "Single Use Quota Policy",
        "max_downloads": 1
    }
    client.post("/api/policies", json=policy_data, headers=admin_headers)

    # Download 1: Succeeds (1/1)
    res1 = client.get(f"/api/papers/{paper_id}/download", headers=prof_headers)
    assert res1.status_code == 200

    # Download 2: Denied (Quota exceeded)
    res2 = client.get(f"/api/papers/{paper_id}/download", headers=prof_headers)
    assert res2.status_code == 403
    assert "quota" in res2.json()["detail"].lower()
