import pytest
import io

def create_paper_for_exam(client, admin_headers):
    files = {"file": ("exam_paper.pdf", io.BytesIO(b"%PDF-1.7 Exam Test Paper Content"), "application/pdf")}
    data = {"title": "Secure Exam Paper", "subject": "PQC", "course_code": "EXAM-101", "semester": "Fall 2026", "exam_date": "2026-11-15"}
    res = client.post("/api/papers", data=data, files=files, headers=admin_headers)
    return res.json()["id"]

def test_exam_state_transitions_and_gated_download(client, admin_headers, centre_headers):
    """Verifies exam state transitions and download gating in created, locked, released, closed states."""
    paper_id = create_paper_for_exam(client, admin_headers)

    # 1. Create Exam (status = created)
    exam_payload = {
        "name": "Midterm Cryptography Exam",
        "date": "2026-11-20",
        "start_time": "09:00",
        "end_time": "12:00",
        "paper_id": paper_id,
        "authorized_centres": [3]
    }
    create_res = client.post("/api/exams", json=exam_payload, headers=admin_headers)
    assert create_res.status_code == 200
    exam_id = create_res.json()["id"]
    assert create_res.json()["status"] == "created"

    # Download in 'created' state should be BLOCKED for centre user
    dl_created = client.get(f"/api/papers/{paper_id}/download", headers=centre_headers)
    assert dl_created.status_code == 403

    # 2. Transition to 'locked'
    trans_locked = client.patch(f"/api/exams/{exam_id}/transition", json={"status": "locked"}, headers=admin_headers)
    assert trans_locked.status_code == 200
    assert trans_locked.json()["status"] == "locked"

    # Download in 'locked' state should be BLOCKED for centre user
    dl_locked = client.get(f"/api/papers/{paper_id}/download", headers=centre_headers)
    assert dl_locked.status_code == 403

    # 3. Transition to 'released'
    trans_released = client.patch(f"/api/exams/{exam_id}/transition", json={"status": "released"}, headers=admin_headers)
    assert trans_released.status_code == 200
    assert trans_released.json()["status"] == "released"

    # Download in 'released' state should SUCCEED for centre user
    dl_released = client.get(f"/api/papers/{paper_id}/download", headers=centre_headers)
    assert dl_released.status_code == 200

    # 4. Transition to 'closed'
    trans_closed = client.patch(f"/api/exams/{exam_id}/transition", json={"status": "closed"}, headers=admin_headers)
    assert trans_closed.status_code == 200
    assert trans_closed.json()["status"] == "closed"

    # Download in 'closed' state should be BLOCKED
    dl_closed = client.get(f"/api/papers/{paper_id}/download", headers=centre_headers)
    assert dl_closed.status_code == 403

def test_negative_invalid_exam_transition(client, admin_headers):
    """Negative Test: Supplying an invalid state transition status returns HTTP 400."""
    paper_id = create_paper_for_exam(client, admin_headers)
    exam_payload = {
        "name": "Invalid State Exam",
        "date": "2026-11-20",
        "start_time": "09:00",
        "end_time": "12:00",
        "paper_id": paper_id
    }
    create_res = client.post("/api/exams", json=exam_payload, headers=admin_headers)
    exam_id = create_res.json()["id"]

    invalid_res = client.patch(f"/api/exams/{exam_id}/transition", json={"status": "UNKNOWN_STATE"}, headers=admin_headers)
    assert invalid_res.status_code == 400
