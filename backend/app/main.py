from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from .database import engine, Base
from .limiter import limiter
from .routers import auth, papers, policies, provenance, exams, threat, simulations

app = FastAPI(
    title="Quantum Shield Backend",
    description="Adaptive, Post-Quantum Secure Examination Distribution System API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

@app.on_event("startup")
def startup_event():
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Startup DB init warning: {e}")

# Attach rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

import traceback
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_trace = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    print("GLOBAL EXCEPTION TRACEBACK:\n", error_trace)
    return JSONResponse(status_code=500, content={"detail": str(exc), "trace": error_trace})

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api", tags=["authentication"])
app.include_router(papers.router, prefix="/api", tags=["papers"])
app.include_router(policies.router, prefix="/api", tags=["policies"])
app.include_router(provenance.router, prefix="/api", tags=["provenance"])
app.include_router(exams.router, prefix="/api", tags=["exams"])
app.include_router(threat.router, prefix="/api", tags=["threat"])
app.include_router(simulations.router, prefix="/api", tags=["simulations"])

from typing import Optional
from fastapi import WebSocket, WebSocketDisconnect, status, Query, Depends
from sqlalchemy.orm import Session
import jwt
from . import config, database, models
from .websocket_manager import manager

@app.websocket("/ws/crypto-events")
async def websocket_crypto_events(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    db: Session = Depends(database.get_db)
):
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    try:
        payload = jwt.decode(token, config.JWT_SECRET, algorithms=["HS256"])
        email: str = payload.get("sub")
        if not email:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception as e:
        print(f"WS Auth Exception: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, user.id, user.role_id, user.email)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
async def root():
    return {"message": "Quantum Shield PQC Security Engine Running"}
