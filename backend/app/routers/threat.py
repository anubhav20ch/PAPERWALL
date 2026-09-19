import json
import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from .. import database, models, security

router = APIRouter()

class FlagUserRequest(BaseModel):
    status: str  # Normal, Suspicious, Frozen
    reason: Optional[str] = None

@router.get("/threat/risk-scores")
async def get_risk_scores(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    users = db.query(models.User).all()
    results = []
    
    for u in users:
        profile = db.query(models.BehaviorProfile).filter(models.BehaviorProfile.user_id == u.id).first()
        if not profile:
            profile = models.BehaviorProfile(
                user_id=u.id,
                current_risk_score=10,
                status="Normal"
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)

        # Count incidents
        incident_count = db.query(models.SecurityIncident).filter(models.SecurityIncident.user_id == u.id).count()

        results.append({
            "user_id": u.id,
            "email": u.email,
            "name": u.name,
            "role_id": u.role_id,
            "role": "Admin" if u.role_id == 1 else "Professor" if u.role_id == 2 else "Exam Centre",
            "department": u.department,
            "current_risk_score": profile.current_risk_score,
            "status": profile.status,
            "incident_count": incident_count,
            "last_active": profile.last_active
        })

    return results

@router.get("/threat/incidents")
async def list_security_incidents(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    incidents = db.query(models.SecurityIncident).order_by(models.SecurityIncident.id.desc()).all()
    return [
        {
            "id": inc.id,
            "timestamp": inc.timestamp,
            "paper_id": inc.paper_id,
            "user_id": inc.user_id,
            "role": inc.role,
            "reason": inc.reason,
            "action": inc.action,
            "status": inc.status
        }
        for inc in incidents
    ]

@router.post("/threat/flag-user/{target_user_id}")
async def flag_user(
    target_user_id: int,
    req: FlagUserRequest,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role_id != 1:  # Admin only
        raise HTTPException(status_code=403, detail="Only administrators can manage insider threat status.")

    profile = db.query(models.BehaviorProfile).filter(models.BehaviorProfile.user_id == target_user_id).first()
    if not profile:
        profile = models.BehaviorProfile(user_id=target_user_id)
        db.add(profile)

    profile.status = req.status
    if req.status == "Frozen":
        profile.current_risk_score = 95
    elif req.status == "Suspicious":
        profile.current_risk_score = 65
    else:
        profile.current_risk_score = 10

    db.commit()

    # Log Security Incident
    inc = models.SecurityIncident(
        user_id=target_user_id,
        role="Target User",
        reason=req.reason or f"User status modified to {req.status}",
        action=f"Account Status Set to {req.status}",
        status="Mitigated" if req.status == "Normal" else "Open"
    )
    db.add(inc)
    db.commit()

    return {"user_id": target_user_id, "status": profile.status, "current_risk_score": profile.current_risk_score}
