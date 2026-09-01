import os
import secrets
from pathlib import Path
from typing import List
from pydantic import BaseModel

# Automatically load .env if present in local dev
env_file = Path(__file__).resolve().parent / ".env"
if env_file.exists():
    with open(env_file, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

class Settings(BaseModel):
    PROJECT_NAME: str = "Securox Zero-Trust Government Security Portal"
    VERSION: str = "1.1.0"
    API_V1_PREFIX: str = "/api"
    
    # Environment-driven JWT Secret Key
    SECRET_KEY: str = os.getenv("SECRET_KEY") or secrets.token_hex(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 hours
    STEP_UP_TOKEN_EXPIRE_MINUTES: int = 15     # 15 minutes for high-risk elevation
    
    # Database Connection
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./securox_gov.db")
    
    # CORS Origin Restrictions
    CORS_ALLOWED_ORIGINS: List[str] = [
        origin.strip() for origin in os.getenv(
            "CORS_ALLOWED_ORIGINS", 
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
        ).split(",") if origin.strip()
    ]
    
    # Anomaly Detection Thresholds (Isolation Forest)
    ANOMALY_THRESHOLD: float = float(os.getenv("ANOMALY_THRESHOLD", "0.65"))
    MAX_FAILED_LOGINS: int = int(os.getenv("MAX_FAILED_LOGINS", "4"))
    API_RATE_LIMIT_PER_MIN: int = int(os.getenv("API_RATE_LIMIT_PER_MIN", "40"))

    # Securox SIEM Correlation Engine Uplink
    SECUROX_CORRELATION_URL: str = os.getenv("SECUROX_CORRELATION_URL", "https://securox-engine.gov.internal/api/v1/events")

settings = Settings()
