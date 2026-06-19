"""Transaction service - persistence helpers."""
from sqlalchemy.orm import Session

from app.models.transaction_model import Transaction


def save_transaction(
    db: Session,
    user_id: int,
    amount: float,
    beneficiary_id: str,
    beneficiary_name: str,
    is_new_beneficiary: bool,
    city: str,
    country: str,
    transaction_hour: int,
    risk_score: int,
    risk_level: str,
    risk_reasons: str,
    status: str,
) -> Transaction:
    txn = Transaction(
        user_id=user_id,
        amount=amount,
        beneficiary_id=beneficiary_id,
        beneficiary_name=beneficiary_name,
        is_new_beneficiary=is_new_beneficiary,
        city=city,
        country=country,
        transaction_hour=transaction_hour,
        risk_score=risk_score,
        risk_level=risk_level,
        risk_reasons=risk_reasons,
        status=status,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn
