"""Fraud case routes."""
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.case_model import FraudCase
from app.schemas.case_schema import CaseOut, CaseUpdateRequest

router = APIRouter(prefix="/api/cases", tags=["cases"])


@router.get("", response_model=List[CaseOut])
def get_cases(db: Session = Depends(get_db)):
    rows = db.query(FraudCase).order_by(FraudCase.created_at.desc()).all()
    return [CaseOut.model_validate(r) for r in rows]


@router.patch("/{case_id}", response_model=CaseOut)
def update_case(case_id: int, payload: CaseUpdateRequest, db: Session = Depends(get_db)):
    case = db.query(FraudCase).filter(FraudCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if payload.case_status is not None:
        case.case_status = payload.case_status
    if payload.admin_notes is not None:
        case.admin_notes = payload.admin_notes
    case.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(case)
    return CaseOut.model_validate(case)
