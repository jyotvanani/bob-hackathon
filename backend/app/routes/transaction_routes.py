"""Transaction routes."""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user_model import User
from app.schemas.transaction_schema import (
    TransactionCreate,
    TransactionCreateResponse,
    TransactionOut,
)
from app.services import risk_service, alert_service, case_service, transaction_service

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.post("", response_model=TransactionCreateResponse)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id).first()

    score, level, reasons, status, action = risk_service.calculate_transaction_risk(
        user=user,
        amount=payload.amount,
        is_new_beneficiary=bool(payload.is_new_beneficiary),
        city=payload.city,
        country=payload.country,
        transaction_hour=payload.transaction_hour,
    )

    txn = transaction_service.save_transaction(
        db=db,
        user_id=payload.user_id,
        amount=payload.amount,
        beneficiary_id=payload.beneficiary_id,
        beneficiary_name=payload.beneficiary_name,
        is_new_beneficiary=bool(payload.is_new_beneficiary),
        city=payload.city,
        country=payload.country,
        transaction_hour=payload.transaction_hour,
        risk_score=score,
        risk_level=level,
        risk_reasons=", ".join(reasons),
        status=status,
    )

    if user:
        message = f"Transaction risk {level} ({score}) - amount {payload.amount} - reasons: {', '.join(reasons)}"
        alert = alert_service.create_alert_if_needed(db, user.id, "Transaction", level, message)
        case_service.create_case_if_needed(db, user.id, alert.id if alert else None, score, level)

    return TransactionCreateResponse(
        success=(level == "Low"),
        transaction_id=txn.id,
        risk_score=score,
        risk_level=level,
        risk_reasons=reasons,
        status=status,
        recommended_action=action,
    )


@router.get("", response_model=List[TransactionOut])
def get_transactions(db: Session = Depends(get_db)):
    from app.models.transaction_model import Transaction
    rows = db.query(Transaction).order_by(Transaction.created_at.desc()).all()
    return [TransactionOut.model_validate(r) for r in rows]
