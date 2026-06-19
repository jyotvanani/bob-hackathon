"""Authentication routes."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user_model import User
from app.models.login_model import LoginEvent
from app.schemas.auth_schema import LoginRequest, LoginResponse, UserOut
from app.services import risk_service, alert_service, case_service, device_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = None
    usual_city: Optional[str] = "Surat"
    usual_country: Optional[str] = "India"


@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    # Public signup is restricted to customer accounts only.
    user = User(
        name=payload.name,
        email=payload.email,
        password=payload.password,
        phone=payload.phone,
        role="customer",
        usual_city=payload.usual_city or "Surat",
        usual_country=payload.usual_country or "India",
        usual_login_start_hour=8,
        usual_login_end_hour=22,
        average_transaction_amount=5000.0,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {
        "success": True,
        "message": "Registration successful",
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
    }


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    failed_attempt = False
    if user and user.password != payload.password:
        failed_attempt = True
    if user is None:
        failed_attempt = True

    score, level, reasons, action = risk_service.calculate_login_risk(
        db=db,
        user=user,
        device_id=payload.device_id,
        city=payload.city,
        country=payload.country,
        login_hour=payload.login_hour,
        ip_address=payload.ip_address,
        failed_attempt=failed_attempt,
    )

    # Save login event
    login_event = LoginEvent(
        user_id=user.id if user else None,
        email=payload.email,
        device_id=payload.device_id,
        browser=payload.browser,
        os=payload.os,
        ip_address=payload.ip_address,
        city=payload.city,
        country=payload.country,
        login_hour=payload.login_hour,
        is_successful=(user is not None and not failed_attempt),
        risk_score=score,
        risk_level=level,
        risk_reasons=", ".join(reasons),
        recommended_action=action,
    )
    db.add(login_event)
    db.commit()
    db.refresh(login_event)

    # If user known and not failed and risk acceptable, register the device
    if user and not failed_attempt and payload.device_id:
        device_service.upsert_device(
            db=db,
            user_id=user.id,
            device_id=payload.device_id,
            device_name=payload.device_name,
            browser=payload.browser,
            os=payload.os,
            is_trusted=(level == "Low"),
        )

    # Alerts and cases
    alert = None
    if user:
        message = f"Login risk {level} ({score}) from {payload.city or 'unknown'} - reasons: {', '.join(reasons)}"
        alert = alert_service.create_alert_if_needed(
            db, user.id, "Login", level, message
        )
        case_service.create_case_if_needed(
            db, user.id, alert.id if alert else None, score, level
        )

    user_out = UserOut.model_validate(user) if user else None
    success = user is not None and not failed_attempt and level not in ("High", "Critical")
    return LoginResponse(
        success=success,
        message="Login processed",
        user=user_out,
        risk_score=score,
        risk_level=level,
        risk_reasons=reasons,
        recommended_action=action,
    )
