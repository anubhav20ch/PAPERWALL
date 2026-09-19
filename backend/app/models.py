import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role_id = Column(Integer, nullable=False)  # 1 = admin, 2 = professor, 3 = centre
    department = Column(String, nullable=True)
    status = Column(String, default="Active")  # Active, Inactive
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    papers_uploaded = relationship("Paper", back_populates="uploader")
    risk_profiles = relationship("BehaviorProfile", back_populates="user")
    policy_evals = relationship("PolicyEvaluation", back_populates="user")


class Paper(Base):
    __tablename__ = "papers"

    id = Column(String, primary_key=True, index=True)  # e.g. "P-2023-001"
    title = Column(String, nullable=False)
    subject = Column(String, nullable=True)
    course_code = Column(String, nullable=False)
    semester = Column(String, nullable=True)
    exam_date = Column(String, nullable=True)
    exam_time = Column(String, nullable=True, default="09:00")
    file_path = Column(String, nullable=True)  # Location on disk
    sha3_hash = Column(String, nullable=True)
    dilithium_signature = Column(Text, nullable=True)
    kyber_public_key = Column(Text, nullable=True)
    
    # Status flags mapping to UI
    encryption_status = Column(String, default="Pending")    # Encrypted, Pending
    hash_status = Column(String, default="Pending")          # Generated, Pending
    verification_status = Column(String, default="Pending")  # Secured, Pending
    status = Column(String, default="Uploaded Successfully") # Verified, Pending, Secured, Uploaded Successfully
    
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    uploader = relationship("User", back_populates="papers_uploaded")
    policies = relationship("AccessPolicy", back_populates="paper", cascade="all, delete-orphan")
    provenance_events = relationship("ProvenanceEvent", back_populates="paper", cascade="all, delete-orphan")
    exams = relationship("Exam", back_populates="paper")
    crypto_operations = relationship("CryptoOperation", back_populates="paper", cascade="all, delete-orphan")
    key_rotations = relationship("KeyRotation", back_populates="paper", cascade="all, delete-orphan")
    incidents = relationship("SecurityIncident", back_populates="paper", cascade="all, delete-orphan")


class AccessPolicy(Base):
    __tablename__ = "access_policies"

    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(String, ForeignKey("papers.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    valid_from = Column(DateTime, nullable=True)
    valid_until = Column(DateTime, nullable=True)
    max_downloads = Column(Integer, default=5)
    current_downloads = Column(Integer, default=0)
    required_role = Column(Integer, nullable=True)  # Role allowed
    required_organization = Column(String, nullable=True)
    required_security_level = Column(String, nullable=True) # PUBLIC, CONFIDENTIAL, RESTRICTED
    require_signature_verification = Column(Boolean, default=True)
    require_integrity_verification = Column(Boolean, default=True)
    require_reauth = Column(Boolean, default=False)
    allow_offline_access = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    paper = relationship("Paper", back_populates="policies")
    evaluations = relationship("PolicyEvaluation", back_populates="policy", cascade="all, delete-orphan")


class PolicyEvaluation(Base):
    __tablename__ = "policy_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    policy_id = Column(Integer, ForeignKey("access_policies.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    success = Column(Boolean, nullable=False)
    detail_json = Column(Text, nullable=False)  # JSON representation of per-rule pass/fail

    # Relationships
    policy = relationship("AccessPolicy", back_populates="evaluations")
    user = relationship("User", back_populates="policy_evals")


class ProvenanceEvent(Base):
    __tablename__ = "provenance_events"

    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(String, ForeignKey("papers.id"), nullable=False)
    event_type = Column(String, nullable=False)  # Created, Encrypted, Signed, Distributed, Received, Verified, Downloaded
    actor = Column(String, nullable=False)       # Email or system actor name
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    prev_record_hash = Column(String, nullable=True)
    payload_hash = Column(String, nullable=False)  # Current state hash
    signature = Column(Text, nullable=True)        # ML-DSA signature over event details
    verified = Column(Boolean, default=True)

    # Relationships
    paper = relationship("Paper", back_populates="provenance_events")


class BehaviorProfile(Base):
    __tablename__ = "behavior_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    last_active = Column(DateTime, default=datetime.datetime.utcnow)
    base_access_hours_json = Column(Text, nullable=True)  # Baseline active hours JSON [9, 10, 11, 12, 13, 14, 15, 16, 17]
    download_baseline_count = Column(Float, default=1.0) # Baseline downloads per hour
    baseline_daily_count = Column(Float, default=5.0)    # Baseline daily count
    current_risk_score = Column(Integer, default=10)      # Risk score (0 - 100)
    status = Column(String, default="Normal")             # Normal, Suspicious, Frozen

    # Relationships
    user = relationship("User", back_populates="risk_profiles")


class SecurityIncident(Base):
    __tablename__ = "security_incidents"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    paper_id = Column(String, ForeignKey("papers.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    role = Column(String, nullable=False)        # Attacker Role (Hacker, Exam Centre, etc)
    reason = Column(String, nullable=False)      # Failed Signature, Tampered Payload, etc
    action = Column(String, nullable=False)      # Blocked, Session Terminated, Profile Frozen
    status = Column(String, default="Open")      # Open, Mitigated, Ignored
    details_json = Column(Text, nullable=True)   # JSON string for logs and What-If analytics

    # Relationships
    paper = relationship("Paper", back_populates="incidents")


class SecurityAnomaly(Base):
    __tablename__ = "security_anomalies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    anomaly_type = Column(String, nullable=False)  # Time Deviation, Frequency Spike, Access Burst
    risk_score_delta = Column(Integer, nullable=False)
    description = Column(String, nullable=False)


class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    subject = Column(String, nullable=True)
    date = Column(String, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    paper_id = Column(String, ForeignKey("papers.id"), nullable=False)
    authorized_centres_json = Column(Text, nullable=False)  # JSON string list of authorized user ids
    max_downloads = Column(Integer, default=5)
    security_classification = Column(String, default="CONFIDENTIAL")  # CONFIDENTIAL, RESTRICTED
    status = Column(String, default="created")  # created, locked, released, closed

    # Relationships
    paper = relationship("Paper", back_populates="exams")
    events = relationship("ExamEvent", back_populates="exam", cascade="all, delete-orphan")


class ExamEvent(Base):
    __tablename__ = "exam_events"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    event_type = Column(String, nullable=False)  # locked, released, download_attempt, verified, expired
    actor = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    ip_address = Column(String, nullable=True)
    description = Column(String, nullable=True)

    # Relationships
    exam = relationship("Exam", back_populates="events")


class CryptoOperation(Base):
    __tablename__ = "crypto_operations"

    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(String, ForeignKey("papers.id"), nullable=False)
    operation_type = Column(String, nullable=False)  # Encrypt, Decrypt, Sign, Verify, Encap, Decap
    algorithm = Column(String, nullable=False)       # AES-256-GCM, ML-KEM-768, ML-DSA-65, SHA3-256
    key_id = Column(String, nullable=True)
    hash_value = Column(String, nullable=True)
    nonce_id = Column(String, nullable=True)
    ciphertext_size = Column(Integer, nullable=True)
    signature_size = Column(Integer, nullable=True)
    duration_ms = Column(Float, nullable=False)      # Execution speed in milliseconds
    status = Column(String, default="SUCCESS")       # SUCCESS, FAILED
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    paper = relationship("Paper", back_populates="crypto_operations")


class KeyRotation(Base):
    __tablename__ = "key_rotations"

    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(String, ForeignKey("papers.id"), nullable=False)
    reason = Column(String, nullable=False)
    old_key_id = Column(String, nullable=True)
    new_key_id = Column(String, nullable=True)
    rotated_by = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    paper = relationship("Paper", back_populates="key_rotations")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(String, nullable=False)  # User Email or "System"
    action = Column(String, nullable=False)
    status = Column(String, nullable=False)   # Success, Failed, Tampered, Blocked
    ip_address = Column(String, nullable=True)
