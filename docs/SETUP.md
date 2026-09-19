# QuantumShield Local Setup & Developer Guide

This document provides step-by-step instructions to set up, seed, run, build, and test QuantumShield locally.

---

## 1. Prerequisites

- **Python**: Python 3.10+ (Python 3.14 recommended)
- **Node.js**: Node.js v18+ and `npm`
- **Database**: PostgreSQL 14+ (WSL Ubuntu or native Windows service)
- **C Compiler / Build Tools**: Required for PyCA `cryptography` C-extensions.

---

## 2. Environment Configuration (`.env`)

Create a `.env` file inside `backend/` directory:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/quantum_shield
JWT_SECRET=quantumshield_secure_jwt_secret_key_2026_pqc
ACCESS_TOKEN_EXPIRE_MINUTES=120
```

---

## 3. Backend Setup & Database Migrations

### Step 1: Initialize Virtual Environment
```bash
cd backend
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate
```

### Step 2: Install Python Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 3: Configure & Start PostgreSQL Database
```bash
# Inside WSL Ubuntu (if using WSL PostgreSQL):
sudo service postgresql start
sudo -u postgres psql -c "CREATE DATABASE quantum_shield;"
```

### Step 4: Run Database Migrations & Seed Users
```bash
# Run Alembic migrations to construct database tables
alembic upgrade head

# Seed initial system users (Admin, Professor, Exam Centre)
python seed_users.py
```

### Seeded Credentials:
- **Admin**: `admin@quantumshield.com` / `admin123` (Role ID 1)
- **Professor**: `a.turing@university.edu` / `prof123` (Role ID 2)
- **Exam Centre**: `centre.north@university.edu` / `centre123` (Role ID 3)

---

## 4. Running the Backend Server

```bash
cd backend
venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base URL: `http://127.0.0.1:8000/api`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`
- WebSocket Endpoint: `ws://127.0.0.1:8000/ws/crypto-events`

---

## 5. Frontend Setup & Build

```bash
cd quantum-shield

# Install Node dependencies
npm install

# Start Vite Development Server
npm run dev
```
- Application UI URL: `http://localhost:5173` (Proxies `/api/*` and `/ws/*` requests to Uvicorn).

### Production Build Verification
```bash
npm run build
```

---

## 6. Running Automated Test Suite

```bash
cd backend
venv\Scripts\python -m pytest tests/ -v
```
All 26 automated unit and integration tests across Auth, Cryptography Core, Policies, Provenance, Exams, Threat, Simulations, and WebSockets must return **PASSED** (100% pass rate).
