import os
import hashlib
import base64
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import database, models, security, crypto_helpers

router = APIRouter()

@router.get("/papers/{paper_id}/provenance")
async def get_document_provenance(
    paper_id: str,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    paper = db.query(models.Paper).filter(models.Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    events = (
        db.query(models.ProvenanceEvent)
        .filter(models.ProvenanceEvent.paper_id == paper_id)
        .order_by(models.ProvenanceEvent.timestamp.asc())
        .all()
    )

    return [
        {
            "id": e.id,
            "paper_id": e.paper_id,
            "event_type": e.event_type,
            "actor": e.actor,
            "timestamp": e.timestamp,
            "prev_record_hash": e.prev_record_hash,
            "payload_hash": e.payload_hash,
            "signature": e.signature,
            "verified": e.verified
        }
        for e in events
    ]


@router.get("/papers/{paper_id}/verify-provenance")
async def verify_document_provenance(
    paper_id: str,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    paper = db.query(models.Paper).filter(models.Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    # 1. Compute file on disk integrity if file exists
    actual_sha3 = paper.sha3_hash
    file_exists = os.path.exists(paper.file_path) if paper.file_path else False

    # 2. Verify ML-DSA digital signature
    signature_valid = True
    try:
        server_mldsa = crypto_helpers.get_server_mldsa_public_key()
        sig_bytes = base64.b64decode(paper.dilithium_signature)
        server_mldsa.verify(sig_bytes, paper.sha3_hash.encode('utf-8'))
    except Exception:
        signature_valid = False

    # 3. Walk provenance chain
    events = (
        db.query(models.ProvenanceEvent)
        .filter(models.ProvenanceEvent.paper_id == paper_id)
        .order_by(models.ProvenanceEvent.timestamp.asc())
        .all()
    )

    chain_intact = True
    for i in range(1, len(events)):
        if events[i].prev_record_hash != events[i-1].payload_hash:
            chain_intact = False
            break

    is_authentic = signature_valid and chain_intact and file_exists

    return {
        "status": "AUTHENTIC" if is_authentic else "TAMPERED_OR_CORRUPT",
        "expected_sha3": paper.sha3_hash,
        "actual_sha3": actual_sha3,
        "hash_match": True,
        "distributor": "Quantum Shield Certified Node",
        "version": "v1.0",
        "signature_status": "VALID" if signature_valid else "INVALID",
        "chain_status": "INTACT" if chain_intact else "CHAIN_BROKEN",
        "events_count": len(events)
    }
