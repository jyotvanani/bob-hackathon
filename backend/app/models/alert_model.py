"""Alert model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey

from app.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    alert_type = Column(String, default="Login")  # Login or Transaction
    risk_level = Column(String, default="Medium")
    message = Column(String, default="")
    status = Column(String, default="Open")  # Open, Reviewing, Resolved, False Positive
    created_at = Column(DateTime, default=datetime.utcnow)
