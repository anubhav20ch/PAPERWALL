import json
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from .. import database, models, security

router = APIRouter()

class ExamCreate(BaseModel):
    name: str
    subject: Optional[str] = None
    date: str
    start_time: str
    end_time: str
    paper_id: str
    authorized_centres: List[int] = []
    max_downloads: int = 5
    security_classification: str = "CONFIDENTIAL"

class ExamStatusUpdate(BaseModel):
    status: str  # created, locked, released, closed
    description: Optional[str] = None

@router.get("/exams")
async def list_exams(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    exams = db.query(models.Exam).order_by(models.Exam.id.desc()).all()
    res = []
    for e in exams:
        res.append({
            "id": e.id,
            "name": e.name,
            "subject": e.subject,
            "date": e.date,
            "start_time": e.start_time,
            "end_time": e.end_time,
            "paper_id": e.paper_id,
            "authorized_centres": json.loads(e.authorized_centres_json) if e.authorized_centres_json else [],
            "max_downloads": e.max_downloads,
            "security_classification": e.security_classification,
            "status": e.status
        })
    return res

@router.post("/exams")
async def create_exam(
    exam_in: ExamCreate,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role_id != 1:  # Admin only
        raise HTTPException(status_code=403, detail="Only administrators can schedule secure examination windows.")

    paper = db.query(models.Paper).filter(models.Paper.id == exam_in.paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    exam = models.Exam(
        name=exam_in.name,
        subject=exam_in.subject or paper.subject,
        date=exam_in.date,
        start_time=exam_in.start_time,
        end_time=exam_in.end_time,
        paper_id=exam_in.paper_id,
        authorized_centres_json=json.dumps(exam_in.authorized_centres),
        max_downloads=exam_in.max_downloads,
        security_classification=exam_in.security_classification,
        status="created"
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)

    event = models.ExamEvent(
        exam_id=exam.id,
        event_type="created",
        actor=current_user.email,
        description="Exam window created and scheduled."
    )
    db.add(event)
    db.commit()

    return {"id": exam.id, "name": exam.name, "status": exam.status}

@router.get("/exams/{exam_id}")
async def get_exam(
    exam_id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    events = db.query(models.ExamEvent).filter(models.ExamEvent.exam_id == exam_id).order_by(models.ExamEvent.timestamp.asc()).all()

    return {
        "id": exam.id,
        "name": exam.name,
        "subject": exam.subject,
        "date": exam.date,
        "start_time": exam.start_time,
        "end_time": exam.end_time,
        "paper_id": exam.paper_id,
        "authorized_centres": json.loads(exam.authorized_centres_json) if exam.authorized_centres_json else [],
        "max_downloads": exam.max_downloads,
        "security_classification": exam.security_classification,
        "status": exam.status,
        "events": [
            {
                "id": evt.id,
                "event_type": evt.event_type,
                "actor": evt.actor,
                "timestamp": evt.timestamp,
                "description": evt.description
            }
            for evt in events
        ]
    }

@router.patch("/exams/{exam_id}/transition")
async def transition_exam(
    exam_id: int,
    status_update: ExamStatusUpdate,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    allowed_statuses = ["created", "locked", "released", "closed"]
    if status_update.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {allowed_statuses}")

    exam.status = status_update.status
    db.commit()

    event = models.ExamEvent(
        exam_id=exam.id,
        event_type=status_update.status,
        actor=current_user.email,
        description=status_update.description or f"Exam state transitioned to {status_update.status}"
    )
    db.add(event)
    db.commit()

    return {"id": exam.id, "status": exam.status}
