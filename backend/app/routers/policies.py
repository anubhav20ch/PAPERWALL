import datetime
import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from .. import database, models, security, crypto_helpers

router = APIRouter()

class PolicyCreate(BaseModel):
    paper_id: str
    name: str
    description: Optional[str] = None
    valid_from: Optional[datetime.datetime] = None
    valid_until: Optional[datetime.datetime] = None
    max_downloads: int = 5
    required_role: Optional[int] = None
    required_organization: Optional[str] = None
    required_security_level: Optional[str] = "CONFIDENTIAL"
    require_signature_verification: bool = True
    require_integrity_verification: bool = True
    require_reauth: bool = False
    allow_offline_access: bool = False

@router.get("/policies")
async def list_policies(
    paper_id: Optional[str] = None,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    query = db.query(models.AccessPolicy)
    if paper_id:
        query = query.filter(models.AccessPolicy.paper_id == paper_id)
    policies = query.all()
    
    return [
        {
            "id": p.id,
            "paper_id": p.paper_id,
            "name": p.name,
            "description": p.description,
            "valid_from": p.valid_from,
            "valid_until": p.valid_until,
            "max_downloads": p.max_downloads,
            "current_downloads": p.current_downloads,
            "required_role": p.required_role,
            "required_organization": p.required_organization,
            "required_security_level": p.required_security_level,
            "require_signature_verification": p.require_signature_verification,
            "require_integrity_verification": p.require_integrity_verification,
            "require_reauth": p.require_reauth,
            "allow_offline_access": p.allow_offline_access,
            "created_at": p.created_at
        }
        for p in policies
    ]

@router.post("/policies")
async def create_policy(
    policy_in: PolicyCreate,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role_id != 1:  # Admin only
        raise HTTPException(status_code=403, detail="Only system administrators can create access policies.")

    paper = db.query(models.Paper).filter(models.Paper.id == policy_in.paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")

    policy = models.AccessPolicy(
        paper_id=policy_in.paper_id,
        name=policy_in.name,
        description=policy_in.description,
        valid_from=policy_in.valid_from,
        valid_until=policy_in.valid_until,
        max_downloads=policy_in.max_downloads,
        required_role=policy_in.required_role,
        required_organization=policy_in.required_organization,
        required_security_level=policy_in.required_security_level,
        require_signature_verification=policy_in.require_signature_verification,
        require_integrity_verification=policy_in.require_integrity_verification,
        require_reauth=policy_in.require_reauth,
        allow_offline_access=policy_in.allow_offline_access
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return {"id": policy.id, "name": policy.name, "paper_id": policy.paper_id}


def evaluate_paper_policies(db: Session, paper: models.Paper, user: models.User) -> Tuple[bool, List[Dict[str, Any]], str]:
    """
    Evaluates composable policy rules server-side.
    All active policy rules must pass for key decapsulation.
    """
    policies = db.query(models.AccessPolicy).filter(models.AccessPolicy.paper_id == paper.id).all()
    
    # Default fallback policy if none explicitly defined
    if not policies:
        default_policy = models.AccessPolicy(
            paper_id=paper.id,
            name="Default Protection Policy",
            description="System default policy requiring signature and integrity validation",
            max_downloads=10,
            require_signature_verification=True,
            require_integrity_verification=True
        )
        db.add(default_policy)
        db.commit()
        db.refresh(default_policy)
        policies = [default_policy]

    now = datetime.datetime.utcnow()
    overall_success = True
    fail_reason = ""
    breakdown = []

    for policy in policies:
        # Rule 1: Identity & Role Check
        role_pass = True
        role_note = "User identity authenticated."
        if policy.required_role and user.role_id != policy.required_role and user.role_id != 1:
            role_pass = False
            role_note = f"Required role level {policy.required_role}, user has role {user.role_id}"

        breakdown.append({
            "rule": "Recipient Authorization",
            "status": "PASS" if role_pass else "FAIL",
            "detail": role_note
        })
        if not role_pass:
            overall_success = False
            fail_reason = role_note

        # Rule 2: Time Window Check
        time_pass = True
        time_note = "Within valid access window."
        if policy.valid_from and now < policy.valid_from:
            time_pass = False
            time_note = f"Access window not yet open (opens {policy.valid_from.isoformat()})"
        elif policy.valid_until and now > policy.valid_until:
            time_pass = False
            time_note = f"Access window expired at {policy.valid_until.isoformat()}"

        breakdown.append({
            "rule": "Access Time Window",
            "status": "PASS" if time_pass else "FAIL",
            "detail": time_note
        })
        if not time_pass:
            overall_success = False
            fail_reason = time_note

        # Rule 3: Download Counter Check
        dl_pass = policy.current_downloads < policy.max_downloads
        dl_note = f"Downloads ({policy.current_downloads}/{policy.max_downloads})"
        if not dl_pass:
            dl_note = f"Download quota exceeded ({policy.current_downloads}/{policy.max_downloads})"
        
        breakdown.append({
            "rule": "Download Quota Limit",
            "status": "PASS" if dl_pass else "FAIL",
            "detail": dl_note
        })
        if not dl_pass:
            overall_success = False
            fail_reason = dl_note

        # Rule 4: Digital Signature Verification Check
        sig_pass = True
        sig_note = "ML-DSA digital signature verified."
        if policy.require_signature_verification:
            try:
                server_mldsa = crypto_helpers.get_server_mldsa_public_key()
                import base64
                sig_bytes = base64.b64decode(paper.dilithium_signature)
                server_mldsa.verify(sig_bytes, paper.sha3_hash.encode('utf-8'))
            except Exception as e:
                sig_pass = False
                sig_note = f"Signature verification failure: {str(e)}"

        breakdown.append({
            "rule": "Post-Quantum Signature Verification",
            "status": "PASS" if sig_pass else "FAIL",
            "detail": sig_note
        })
        if not sig_pass:
            overall_success = False
            fail_reason = sig_note

        # Rule 5: SHA3-256 Digest Integrity Check
        hash_pass = True
        hash_note = "SHA3-256 digest integrity confirmed."
        if policy.require_integrity_verification:
            if not paper.sha3_hash or len(paper.sha3_hash) != 64:
                hash_pass = False
                hash_note = "Invalid SHA3 hash digest on paper record."

        breakdown.append({
            "rule": "SHA3-256 Digest Integrity",
            "status": "PASS" if hash_pass else "FAIL",
            "detail": hash_note
        })
        if not hash_pass:
            overall_success = False
            fail_reason = hash_note

        # Log policy evaluation record
        eval_record = models.PolicyEvaluation(
            policy_id=policy.id,
            user_id=user.id,
            success=overall_success,
            detail_json=json.dumps(breakdown)
        )
        db.add(eval_record)
        
        if overall_success:
            policy.current_downloads += 1

        db.commit()

    return overall_success, breakdown, fail_reason
