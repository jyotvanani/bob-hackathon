"""Alert creation logic."""
from sqlalchemy.orm import Session

from app.models.alert_model import Alert


def create_alert_if_needed(db: Session, user_id: int, alert_type: str,
                            risk_level: str, message: str) -> Alert:
    """Create alert if risk level is Medium, High, or Critical."""
    if risk_level not in ("Medium", "High", "Critical"):
        return None
    alert = Alert(
        user_id=user_id,
        alert_type=alert_type,
        risk_level=risk_level,
        message=message,
        status="Open",
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert
