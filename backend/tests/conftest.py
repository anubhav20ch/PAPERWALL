import pytest
import os
import sys
import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.database import Base, get_db
from app import models, security

# Use PostgreSQL test session or SQLite fallback
DATABASE_URL = os.getenv("TEST_DATABASE_URL", "postgresql://qs_user:qs_password@127.0.0.1:5432/quantum_shield")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Ensure database schema and seeded users exist before running tests."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        # Seed Admin
        admin = db.query(models.User).filter(models.User.email == "admin@quantumshield.com").first()
        if not admin:
            admin = models.User(
                email="admin@quantumshield.com",
                name="Admin User",
                hashed_password=security.get_password_hash("admin123"),
                role_id=1,
                department="IT Security",
                status="Active"
            )
            db.add(admin)

        # Seed Professor
        prof = db.query(models.User).filter(models.User.email == "a.turing@university.edu").first()
        if not prof:
            prof = models.User(
                email="a.turing@university.edu",
                name="Dr. Alan Turing",
                hashed_password=security.get_password_hash("professor123"),
                role_id=2,
                department="Computer Science",
                status="Active"
            )
            db.add(prof)

        # Seed Exam Centre
        centre = db.query(models.User).filter(models.User.email == "centre.north@university.edu").first()
        if not centre:
            centre = models.User(
                email="centre.north@university.edu",
                name="Exam Centre North",
                hashed_password=security.get_password_hash("centre123"),
                role_id=3,
                department="External",
                status="Active"
            )
            db.add(centre)

        db.commit()
    finally:
        db.close()

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client():
    def _override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def admin_token():
    return security.create_access_token({"sub": "admin@quantumshield.com"})

@pytest.fixture
def prof_token():
    return security.create_access_token({"sub": "a.turing@university.edu"})

@pytest.fixture
def centre_token():
    return security.create_access_token({"sub": "centre.north@university.edu"})

@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}

@pytest.fixture
def prof_headers(prof_token):
    return {"Authorization": f"Bearer {prof_token}"}

@pytest.fixture
def centre_headers(centre_token):
    return {"Authorization": f"Bearer {centre_token}"}
