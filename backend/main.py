"""AccountGuard AI - FastAPI entry point."""
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.init_db import init_database
from app.websocket import manager
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
    manager.set_loop(asyncio.get_event_loop())
    yield


app = FastAPI(
    title="AccountGuard AI",
    description="AI-Based Account Takeover Detection System",
    version="1.2.0",
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


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Single broadcast channel.

    Server pushes JSON messages of shape:
      { "type": "traffic_event" | "alert" | "login" | "transaction" | "case"
              | "onboarding" | "simulator", "payload": {...} }
    The client can send "ping" to keep the connection alive; everything else
    is ignored.
    """
    await manager.connect(websocket)
    try:
        await manager.broadcast({"type": "hello", "payload": {"connected": True}})
        while True:
            # Keep connection open; ignore anything the client sends.
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception:
        await manager.disconnect(websocket)


# Register routers
app.include_router(auth_routes.router)
app.include_router(risk_routes.router)
app.include_router(transaction_routes.router)
app.include_router(dashboard_routes.router)
app.include_router(alert_routes.router)
app.include_router(case_routes.router)
app.include_router(onboarding_routes.router)
app.include_router(traffic_routes.router)
