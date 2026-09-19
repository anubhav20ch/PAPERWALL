from sqlalchemy.orm import Session
from .database import SessionLocal, engine, Base
from .models import User, Paper, AuditLog
from .security import get_password_hash
import datetime

def seed_db():
    # Make sure all tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if users already exist
        admin_email = "admin@quantumshield.com"
        prof_email = "a.turing@university.edu"
        centre_email = "centre.north@university.edu"
        
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                email=admin_email,
                name="Admin User",
                hashed_password=get_password_hash("admin123"),
                role_id=1,
                department="IT Security",
                status="Active"
            )
            db.add(admin)
            print(f"Seeded Admin: {admin_email}")
            
        prof = db.query(User).filter(User.email == prof_email).first()
        if not prof:
            prof = User(
                email=prof_email,
                name="Dr. Alan Turing",
                hashed_password=get_password_hash("professor123"),
                role_id=2,
                department="Computer Science",
                status="Active"
            )
            db.add(prof)
            print(f"Seeded Professor: {prof_email}")
            
        centre = db.query(User).filter(User.email == centre_email).first()
        if not centre:
            centre = User(
                email=centre_email,
                name="Exam Centre North",
                hashed_password=get_password_hash("centre123"),
                role_id=3,
                department="External",
                status="Active"
            )
            db.add(centre)
            print(f"Seeded Exam Centre: {centre_email}")

        # Seed Vulnerable Paper for Attack Simulation Lab
        vuln_paper = db.query(Paper).filter(Paper.id == "P-VULN-001").first()
        if not vuln_paper:
            vuln_paper = Paper(
                id="P-VULN-001",
                title="LEGACY-101: Unencrypted Exam Paper (Vulnerable Test Target)",
                subject="Computer Science",
                course_code="LEGACY-101",
                semester="Fall 2026",
                exam_date="2026-11-20",
                exam_time="09:00",
                file_path="storage/vulnerable_sample.pdf",
                sha3_hash="legacy_unprotected_sha3_digest_hash_sample_vulnerable",
                dilithium_signature="legacy_rsa_2048_signature_vulnerable_to_quantum_attack",
                kyber_public_key="none_unencrypted",
                encryption_status="Unencrypted (Legacy RSA)",
                hash_status="Unprotected",
                verification_status="Vulnerable",
                status="Vulnerable",
                uploaded_by=admin.id if admin else 1
            )
            db.add(vuln_paper)
            print("Seeded Vulnerable Target Paper: P-VULN-001")
            
        db.commit()
        print("Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
