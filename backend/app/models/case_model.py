"""Fraud Case model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey

from app.database import Base


class FraudCase(Base):
    __tablename__ = "fraud_cases"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True)
    risk_score = Column(Integer, default=0)
    case_status = Column(String, default="Pending")  # Pending, Under Review, Blocked, Resolved, False Positive
    admin_notes = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
