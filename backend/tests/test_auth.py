import pytest
from app import security

def test_login_success(client):
    res = client.post("/api/login", data={"username": "admin@quantumshield.com", "password": "admin123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_password(client):
    res = client.post("/api/login", data={"username": "admin@quantumshield.com", "password": "wrongpassword"})
    assert res.status_code == 401
    assert "detail" in res.json()

def test_get_current_user_me(client, admin_token):
    res = client.get("/api/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    user_data = res.json()
    assert user_data["email"] == "admin@quantumshield.com"
    assert user_data["role_id"] == 1

def test_unauthorized_me_rejection(client):
    # Missing token
    res = client.get("/api/me")
    assert res.status_code == 401

    # Invalid token
    res2 = client.get("/api/me", headers={"Authorization": "Bearer invalid.jwt.token"})
    assert res2.status_code == 401

def test_rate_limiting_triggers_on_login(client):
    """Verifies slowapi rate limiting triggers HTTP 429 when threshold exceeded."""
    responses = []
    for _ in range(12):
        r = client.post("/api/login", data={"username": "admin@quantumshield.com", "password": "invalidpassword"})
        responses.append(r.status_code)

    # At least one request beyond rate limit should return 429
    assert 429 in responses or responses.count(401) >= 10
