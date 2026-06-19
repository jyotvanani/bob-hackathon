"""Login Event model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey

from app.database import Base


class LoginEvent(Base):
    __tablename__ = "login_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    email = Column(String, index=True)
    device_id = Column(String, nullable=True)
    browser = Column(String, nullable=True)
    os = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    country = Column(String, nullable=True)
    login_hour = Column(Integer, nullable=True)
    is_successful = Column(Boolean, default=True)

    risk_score = Column(Integer, default=0)
    risk_level = Column(String, default="Low")
    risk_reasons = Column(String, default="")  # comma separated
    recommended_action = Column(String, default="")

    created_at = Column(DateTime, default=datetime.utcnow)
