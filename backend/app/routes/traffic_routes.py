"""Fake / bot traffic routes."""
from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.traffic_model import TrafficEvent
from app.schemas.traffic_schema import (
    TrafficAnalyzeRequest,
    TrafficAnalyzeResponse,
    TrafficEventOut,
    TrafficSummary,
)
from app.services.traffic_service import calculate_traffic_risk
from app.services.traffic_simulator import simulator
from app.websocket import manager

router = APIRouter(prefix="/api/traffic", tags=["traffic"])


class SimulatorStartRequest(BaseModel):
    rate_per_sec: Optional[float] = 2.0
    distribution: Optional[str] = "mixed"  # mixed | normal | attack


@router.post("/analyze", response_model=TrafficAnalyzeResponse)
def analyze(payload: TrafficAnalyzeRequest, db: Session = Depends(get_db)):
    score, level, reasons, action = calculate_traffic_risk(
        db=db,
        event_type=payload.event_type,
        ip_address=payload.ip_address,
        device_id=payload.device_id,
        user_agent=payload.user_agent,
        request_count=payload.request_count or 0,
        form_completion_seconds=payload.form_completion_seconds or 0,
        otp_attempts=payload.otp_attempts or 0,
    )

    event = TrafficEvent(
        event_type=payload.event_type or "generic",
        email=payload.email,
        ip_address=payload.ip_address,
        device_id=payload.device_id,
        user_agent=payload.user_agent,
        request_path=payload.request_path,
        request_count=payload.request_count or 0,
        form_completion_seconds=payload.form_completion_seconds or 0,
        otp_attempts=payload.otp_attempts or 0,
        risk_score=score,
        risk_level=level,
        risk_reasons=", ".join(reasons),
        action_taken=action,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    manager.broadcast_threadsafe({
        "type": "traffic_event",
        "payload": {
            "id": event.id,
            "event_type": event.event_type,
            "ip_address": event.ip_address,
            "device_id": event.device_id,
            "user_agent": event.user_agent,
            "request_count": event.request_count,
            "risk_score": event.risk_score,
            "risk_level": event.risk_level,
            "risk_reasons": event.risk_reasons,
            "action_taken": event.action_taken,
            "created_at": event.created_at.isoformat() if event.created_at else None,
            "source": "manual",
        },
    })

    return TrafficAnalyzeResponse(
        success=(level == "Low"),
        event_id=event.id,
        risk_score=score,
        risk_level=level,
        risk_reasons=reasons,
        action_taken=action,
    )


@router.get("/events", response_model=List[TrafficEventOut])
def list_events(db: Session = Depends(get_db)):
    rows = db.query(TrafficEvent).order_by(TrafficEvent.created_at.desc()).all()
    return [TrafficEventOut.model_validate(r) for r in rows]


@router.get("/summary", response_model=TrafficSummary)
def summary(db: Session = Depends(get_db)):
    total = db.query(func.count(TrafficEvent.id)).scalar() or 0
    high = (
        db.query(func.count(TrafficEvent.id))
        .filter(TrafficEvent.risk_level == "High")
        .scalar()
        or 0
    )
    critical = (
        db.query(func.count(TrafficEvent.id))
        .filter(TrafficEvent.risk_level == "Critical")
        .scalar()
        or 0
    )
    blocked = (
        db.query(func.count(TrafficEvent.id))
        .filter(TrafficEvent.action_taken.like("Block%"))
        .scalar()
        or 0
    )
    return TrafficSummary(
        total_events=total,
        high_risk_events=high,
        critical_events=critical,
        blocked_events=blocked,
    )



# ---------- Real-time simulator ----------


@router.post("/simulator/start")
def start_simulator(payload: SimulatorStartRequest):
    started = simulator.start(
        rate_per_sec=payload.rate_per_sec or 2.0,
        distribution=payload.distribution or "mixed",
    )
    manager.broadcast_threadsafe({
        "type": "simulator",
        "payload": simulator.status(),
    })
    return {"success": True, "started": started, "status": simulator.status()}


@router.post("/simulator/stop")
def stop_simulator():
    stopped = simulator.stop()
    manager.broadcast_threadsafe({
        "type": "simulator",
        "payload": simulator.status(),
    })
    return {"success": True, "stopped": stopped, "status": simulator.status()}


@router.get("/simulator/status")
def simulator_status():
    return simulator.status()
