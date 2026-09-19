import os
from dotenv import load_dotenv

# Load local .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://qs_user:qs_password@127.0.0.1:5432/quantum_shield")
JWT_SECRET = os.getenv("JWT_SECRET", "c8d4f4e24eb1d9e26213fb016db9a31a9ef7190f70c3ba5938f32a76f2d59012")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
STORAGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "storage"))

# Ensure storage directory exists
os.makedirs(STORAGE_DIR, exist_ok=True)
