"""Risk analysis routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user_model import User
from app.models.login_model import LoginEvent
from app.schemas.risk_schema import (
    AnalyzeLoginRequest,
    AnalyzeLoginResponse,
    RiskHistoryResponse,
    RiskHistoryItem,
)
from app.services import risk_service

router = APIRouter(prefix="/api/risk", tags=["risk"])


@router.post("/analyze-login", response_model=AnalyzeLoginResponse)
def analyze_login(payload: AnalyzeLoginRequest, db: Session = Depends(get_db)):
    user = None
    if payload.user_id:
        user = db.query(User).filter(User.id == payload.user_id).first()
    elif payload.email:
        user = db.query(User).filter(User.email == payload.email).first()

    score, level, reasons, action = risk_service.calculate_login_risk(
        db=db,
        user=user,
        device_id=payload.device_id,
        city=payload.city,
        country=payload.country,
        login_hour=payload.login_hour,
        ip_address=payload.ip_address,
        failed_attempt=bool(payload.failed_attempt),
    )

    return AnalyzeLoginResponse(
        risk_score=score,
        risk_level=level,
        risk_reasons=reasons,
        recommended_action=action,
    )


@router.get("/user/{user_id}", response_model=RiskHistoryResponse)
def get_user_risk_history(user_id: int, db: Session = Depends(get_db)):
    events = (
        db.query(LoginEvent)
        .filter(LoginEvent.user_id == user_id)
        .order_by(LoginEvent.created_at.desc())
        .limit(50)
        .all()
    )
    history = [RiskHistoryItem.model_validate(e) for e in events]
    return RiskHistoryResponse(user_id=user_id, history=history)
