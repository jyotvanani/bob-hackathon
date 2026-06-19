"""AccountGuard AI - FastAPI entry point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.init_db import init_database
from app.routes import (
    auth_routes,
    risk_routes,
    transaction_routes,
    dashboard_routes,
    alert_routes,
    case_routes,
    onboarding_routes,
    traffic_routes,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_database()
    yield


app = FastAPI(
    title="AccountGuard AI",
    description="AI-Based Account Takeover Detection System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "AccountGuard AI backend is running"}


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "AccountGuard AI"}


# Register routers
app.include_router(auth_routes.router)
app.include_router(risk_routes.router)
app.include_router(transaction_routes.router)
app.include_router(dashboard_routes.router)
app.include_router(alert_routes.router)
app.include_router(case_routes.router)
app.include_router(onboarding_routes.router)
app.include_router(traffic_routes.router)
