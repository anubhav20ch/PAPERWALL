import pytest
import json
from starlette.testclient import TestClient

def test_websocket_unauthenticated_rejection(client):
    """Negative Test: Connecting without JWT token rejects connection."""
    with pytest.raises(Exception):
        with client.websocket_connect("/ws/crypto-events"):
            pass

def test_websocket_authenticated_connect(client, admin_token):
    """Verifies authenticated WebSocket connection connects successfully."""
    with client.websocket_connect(f"/ws/crypto-events?token={admin_token}") as ws:
        # Connection succeeds cleanly
        assert ws is not None
