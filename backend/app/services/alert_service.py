"""Alert creation logic."""
from sqlalchemy.orm import Session

from app.models.alert_model import Alert
from app.websocket import manager


def create_alert_if_needed(db: Session, user_id: int, alert_type: str,
                            risk_level: str, message: str) -> Alert:
    """Create alert if risk level is Medium, High, or Critical and broadcast."""
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

    manager.broadcast_threadsafe({
        "type": "alert",
        "payload": {
            "id": alert.id,
            "user_id": alert.user_id,
            "alert_type": alert.alert_type,
            "risk_level": alert.risk_level,
            "message": alert.message,
            "status": alert.status,
            "created_at": alert.created_at.isoformat() if alert.created_at else None,
        },
    })
    return alert
