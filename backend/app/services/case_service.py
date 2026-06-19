"""Fraud case logic."""
from typing import Optional
from sqlalchemy.orm import Session

from app.models.case_model import FraudCase


def create_case_if_needed(db: Session, user_id: int, alert_id: Optional[int],
                          risk_score: int, risk_level: str) -> Optional[FraudCase]:
    """Create fraud case if risk level is High or Critical."""
    if risk_level not in ("High", "Critical"):
        return None
    case = FraudCase(
        user_id=user_id,
        alert_id=alert_id,
        risk_score=risk_score,
        case_status="Pending",
        admin_notes="",
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    return case
