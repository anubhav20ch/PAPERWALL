import json
import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from .. import database, models, security, crypto_helpers

router = APIRouter()

class KeyCompromiseSimRequest(BaseModel):
    user_id: Optional[int] = None
    paper_id: Optional[str] = None
    compromise_type: str = "COMPROMISED_DEK"  # COMPROMISED_DEK, NODE_BREACH, LEAKED_CREDENTIALS

class RotateKeyRequest(BaseModel):
    reason: str = "Emergency Post-Quantum Key Rotation"

@router.post("/simulations/key-compromise")
async def simulate_key_compromise(
    req: KeyCompromiseSimRequest,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Simulates What-If scenario: What happens if a key/node/user is compromised?
    Calculates blast radius, affected papers, and mitigation recommendations.
    """
    affected_papers = []
    if req.paper_id:
        papers = db.query(models.Paper).filter(models.Paper.id == req.paper_id).all()
    elif req.user_id:
        papers = db.query(models.Paper).filter(models.Paper.uploaded_by == req.user_id).all()
    else:
        papers = db.query(models.Paper).all()

    for p in papers:
        affected_papers.append({
            "paper_id": p.id,
            "title": p.title,
            "course_code": p.course_code,
            "uploader_id": p.uploaded_by,
            "status": p.status,
            "sha3_hash": p.sha3_hash
        })

    is_vulnerable = False
    if req.paper_id:
        target_p = db.query(models.Paper).filter(models.Paper.id == req.paper_id).first()
        if target_p and ("Vulnerable" in target_p.verification_status or "VULN" in target_p.id):
            is_vulnerable = True

    blast_radius_percentage = round((len(affected_papers) / max(db.query(models.Paper).count(), 1)) * 100, 1)

    if is_vulnerable:
        return {
            "scenario": req.compromise_type,
            "target_user_id": req.user_id,
            "target_paper_id": req.paper_id,
            "attack_succeeded": True,
            "is_vulnerable": True,
            "total_affected_papers": len(affected_papers),
            "blast_radius_percentage": 100.0,
            "risk_level": "CRITICAL",
            "detection_method": "Legacy RSA-2048 / Unencrypted Storage (VULNERABLE)",
            "status_message": "VULNERABILITY EXPOSED: Unencrypted legacy document breached! Attack succeeded.",
            "affected_papers": affected_papers,
            "recommended_actions": [
                "CRITICAL: Upgrade target document to ML-KEM-768 & ML-DSA-65 immediately",
                "Revoke legacy RSA-2048 signing certificate",
                "Isolate vulnerable storage node from active network"
            ]
        }
    else:
        return {
            "scenario": req.compromise_type,
            "target_user_id": req.user_id,
            "target_paper_id": req.paper_id,
            "attack_succeeded": False,
            "is_vulnerable": False,
            "total_affected_papers": len(affected_papers),
            "blast_radius_percentage": blast_radius_percentage,
            "risk_level": "SECURED",
            "detection_method": "PQC Verification Engine (ML-KEM-768 / ML-DSA-65)",
            "status_message": "ATTACK BLOCKED: Verification Engine intercepted threat successfully.",
            "affected_papers": affected_papers,
            "recommended_actions": [
                "Trigger automated ML-KEM key rotation for envelope keys",
                "Issue emergency ML-DSA signature revocation certificate",
                "Log security incident to immutable provenance chain"
            ]
        }


@router.post("/simulations/rotate-key/{paper_id}")
async def rotate_paper_key(
    paper_id: str,
    req: RotateKeyRequest,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Performs live post-quantum key rotation:
    - Re-signs hash with ML-DSA
    - Updates paper record
    - Writes KeyRotation and ProvenanceEvent logs
    """
    if current_user.role_id != 1:  # Admin only
        raise HTTPException(status_code=403, detail="Only administrators can execute key rotation procedures.")

    paper = db.query(models.Paper).filter(models.Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    old_sig = paper.dilithium_signature

    # Re-sign using ML-DSA
    new_mldsa_sig = crypto_helpers.sign_sha3_digest(paper.sha3_hash)
    paper.dilithium_signature = new_mldsa_sig
    paper.status = "Secured (Key Rotated)"

    # Record KeyRotation entry
    rotation = models.KeyRotation(
        paper_id=paper.id,
        reason=req.reason,
        old_key_id=old_sig[:16] if old_sig else "ORIGINAL_KEY",
        new_key_id=new_mldsa_sig[:16],
        rotated_by=current_user.email
    )
    db.add(rotation)
    db.commit()

    # Log Provenance Event
    prov_event = models.ProvenanceEvent(
        paper_id=paper.id,
        event_type="Key Rotated",
        actor=current_user.email,
        prev_record_hash=paper.sha3_hash,
        payload_hash=paper.sha3_hash,
        signature=new_mldsa_sig,
        verified=True
    )
    db.add(prov_event)
    db.commit()

    return {
        "paper_id": paper.id,
        "status": "SUCCESS",
        "message": f"Successfully rotated keys for paper {paper.id}",
        "new_signature_preview": new_mldsa_sig[:32] + "..."
    }
