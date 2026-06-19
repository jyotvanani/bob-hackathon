"""Fake / bot traffic event model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime

from app.database import Base


class TrafficEvent(Base):
    __tablename__ = "traffic_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, default="generic")
    email = Column(String, index=True, nullable=True)
    ip_address = Column(String, index=True, nullable=True)
    device_id = Column(String, index=True, nullable=True)
    user_agent = Column(String, nullable=True)
    request_path = Column(String, nullable=True)
    request_count = Column(Integer, default=0)
    form_completion_seconds = Column(Integer, default=0)
    otp_attempts = Column(Integer, default=0)
    risk_score = Column(Integer, default=0)
    risk_level = Column(String, default="Low")
    risk_reasons = Column(String, default="")
    action_taken = Column(String, default="Allow traffic")
    created_at = Column(DateTime, default=datetime.utcnow)
