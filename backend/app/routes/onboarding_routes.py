"""KYC / Onboarding routes."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.onboarding_model import OnboardingApplication
from app.schemas.onboarding_schema import (
    OnboardingCreate,
    OnboardingCreateResponse,
    OnboardingOut,
    OnboardingUpdateRequest,
)
from app.services.onboarding_service import calculate_onboarding_risk

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])


@router.post("/apply", response_model=OnboardingCreateResponse)
def apply(payload: OnboardingCreate, db: Session = Depends(get_db)):
    score, level, reasons, decision = calculate_onboarding_risk(
        db=db,
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        dob=payload.dob,
        city=payload.city,
        country=payload.country,
        device_id=payload.device_id,
        ip_address=payload.ip_address,
        document_id=payload.document_id,
        document_match_score=payload.document_match_score or 0.0,
        selfie_match_score=payload.selfie_match_score or 0.0,
        form_completion_seconds=payload.form_completion_seconds or 0,
        otp_attempts=payload.otp_attempts or 0,
    )

    application = OnboardingApplication(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        dob=payload.dob,
        city=payload.city,
        country=payload.country,
        device_id=payload.device_id,
        ip_address=payload.ip_address,
        document_id=payload.document_id,
        document_match_score=payload.document_match_score or 0.0,
        selfie_match_score=payload.selfie_match_score or 0.0,
        form_completion_seconds=payload.form_completion_seconds or 0,
        otp_attempts=payload.otp_attempts or 0,
        risk_score=score,
        risk_level=level,
        risk_reasons=", ".join(reasons),
        decision=decision,
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    return OnboardingCreateResponse(
        success=(level == "Low"),
        application_id=application.id,
        risk_score=score,
        risk_level=level,
        risk_reasons=reasons,
        decision=decision,
    )


@router.get("/applications", response_model=List[OnboardingOut])
def list_applications(db: Session = Depends(get_db)):
    rows = (
        db.query(OnboardingApplication)
        .order_by(OnboardingApplication.created_at.desc())
        .all()
    )
    return [OnboardingOut.model_validate(r) for r in rows]


@router.get("/applications/{application_id}", response_model=OnboardingOut)
def get_application(application_id: int, db: Session = Depends(get_db)):
    app_row = (
        db.query(OnboardingApplication)
        .filter(OnboardingApplication.id == application_id)
        .first()
    )
    if not app_row:
        raise HTTPException(status_code=404, detail="Application not found")
    return OnboardingOut.model_validate(app_row)


@router.patch("/applications/{application_id}")
def update_application(
    application_id: int,
    payload: OnboardingUpdateRequest,
    db: Session = Depends(get_db),
):
    app_row = (
        db.query(OnboardingApplication)
        .filter(OnboardingApplication.id == application_id)
        .first()
    )
    if not app_row:
        raise HTTPException(status_code=404, detail="Application not found")
    if payload.decision is not None:
        app_row.decision = payload.decision
    if payload.risk_level is not None:
        app_row.risk_level = payload.risk_level
    db.commit()
    return {"success": True, "message": "Application updated successfully"}
