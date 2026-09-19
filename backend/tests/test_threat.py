import pytest

def test_threat_risk_scores_list(client, admin_headers):
    """Verifies listing threat risk profiles across system users."""
    res = client.get("/api/threat/risk-scores", headers=admin_headers)
    assert res.status_code == 200
    profiles = res.json()
    assert len(profiles) >= 3

    # Normal users baseline false-positive check: risk score should be low
    admin_prof = next(p for p in profiles if p["email"] == "admin@quantumshield.com")
    assert admin_prof["current_risk_score"] <= 20
    assert admin_prof["status"] == "Normal"

def test_flag_user_and_incident_logging(client, admin_headers):
    """Verifies admin can flag an anomalous user as Suspicious or Frozen."""
    flag_res = client.post(
        "/api/threat/flag-user/3",
        json={"status": "Suspicious", "reason": "Anomalous download frequency burst"},
        headers=admin_headers
    )
    assert flag_res.status_code == 200
    assert flag_res.json()["status"] == "Suspicious"
    assert flag_res.json()["current_risk_score"] == 65

    # Check that security incident was created
    inc_res = client.get("/api/threat/incidents", headers=admin_headers)
    assert inc_res.status_code == 200
    incidents = inc_res.json()
    assert any(inc["user_id"] == 3 and "Suspicious" in inc["action"] for inc in incidents)
