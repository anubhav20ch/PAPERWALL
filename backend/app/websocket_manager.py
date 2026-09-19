import json
import datetime
from typing import List, Tuple, Optional, Dict, Any
from fastapi import WebSocket, WebSocketDisconnect, status, Query
from sqlalchemy.orm import Session
import jwt
from . import security, config, database, models

class ConnectionManager:
    def __init__(self):
        # List of tuples: (websocket, user_id, role_id, user_email)
        self.active_connections: List[Tuple[WebSocket, int, int, str]] = []

    async def connect(self, websocket: WebSocket, user_id: int, role_id: int, email: str):
        await websocket.accept()
        self.active_connections.append((websocket, user_id, role_id, email))
        print(f"WS Client Connected: {email} (User ID: {user_id}, Role: {role_id})")

    def disconnect(self, websocket: WebSocket):
        self.active_connections = [
            conn for conn in self.active_connections if conn[0] != websocket
        ]
        print("WS Client Disconnected")

    async def broadcast(self, event_data: Dict[str, Any], target_user_id: Optional[int] = None):
        """
        Broadcasting Logic:
        - Admins (role_id == 1) receive ALL system events.
        - Regular users (roles 2 & 3) receive events if target_user_id == conn.user_id or if actor matches conn.email.
        """
        dead_connections = []
        payload = json.dumps(event_data, default=str)

        for websocket, user_id, role_id, email in self.active_connections:
            # Check scoping
            if role_id == 1 or (target_user_id is not None and user_id == target_user_id) or (event_data.get("actor") == email):
                try:
                    await websocket.send_text(payload)
                except Exception as e:
                    print(f"WS send error to {email}: {e}")
                    dead_connections.append(websocket)

        for ws in dead_connections:
            self.disconnect(ws)

manager = ConnectionManager()

async def broadcast_crypto_op(
    db: Session,
    paper_id: str,
    operation_type: str,
    algorithm: str,
    duration_ms: float,
    status_str: str,
    actor_email: str,
    user_id: int,
    key_id: Optional[str] = None,
    hash_value: Optional[str] = None
):
    """
    Helper function to insert a CryptoOperation row and broadcast over WebSocket.
    """
    op = models.CryptoOperation(
        paper_id=paper_id,
        operation_type=operation_type,
        algorithm=algorithm,
        key_id=key_id[:16] if key_id else None,
        hash_value=hash_value[:16] if hash_value else None,
        duration_ms=round(duration_ms, 3),
        status=status_str
    )
    db.add(op)
    db.commit()
    db.refresh(op)

    event_payload = {
        "type": "CRYPTO_OPERATION",
        "id": op.id,
        "timestamp": op.timestamp.isoformat() if op.timestamp else datetime.datetime.utcnow().isoformat(),
        "actor": actor_email,
        "paper_id": paper_id,
        "operation": operation_type,
        "algorithm": algorithm,
        "duration_ms": round(duration_ms, 3),
        "status": status_str,
        "user_id": user_id
    }
    await manager.broadcast(event_payload, target_user_id=user_id)
    return event_payload
