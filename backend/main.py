from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import init_db
from routes.auth_routes import router as auth_router
from routes.user_routes import router as user_router
from routes.municipal_routes import router as municipal_router
from routes.payment_routes import router as payment_router
from routes.traffic_routes import router as traffic_router
from routes.security_routes import router as security_router
from routes.simulator_routes import router as simulator_router
from routes.ml_routes import router as ml_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print(">>> Securox Zero-Trust Database & Anomaly Engine Initialized successfully.")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Zero-Trust Government Security Portal protecting Municipal, Payment, and Traffic Critical Infrastructure.",
    lifespan=lifespan
)

# Enable Restricted CORS for Frontend Portal & SOC Console
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Route Groups
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(user_router, prefix=settings.API_V1_PREFIX)
app.include_router(municipal_router, prefix=settings.API_V1_PREFIX)
app.include_router(payment_router, prefix=settings.API_V1_PREFIX)
app.include_router(traffic_router, prefix=settings.API_V1_PREFIX)
app.include_router(security_router, prefix=settings.API_V1_PREFIX)
app.include_router(simulator_router, prefix=settings.API_V1_PREFIX)
app.include_router(ml_router, prefix=settings.API_V1_PREFIX)

@app.get("/")
async def root_status():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "zero_trust_status": "ACTIVE",
        "docs_url": "/docs",
        "supported_domains": [
            "Authentication & Adaptive Security",
            "User & RBAC/ABAC Privilege Management",
            "Municipal Administration & Utility Permits",
            "Municipal Treasury & Payment Operations",
            "Smart City Traffic Grid & Emergency Signal Override",
            "Tamper-Evident Hash-Chained Audit Logs",
            "Real-Time SOC Command Center & WebSocket Uplink",
            "Isolation Forest Anomaly Engine & LANL Dataset Benchmarks",
            "Interactive Cyber Attack & Threat Scenario Sandbox"
        ]
    }
