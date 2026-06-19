"""Transaction model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey

from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    amount = Column(Float, default=0.0)
    beneficiary_id = Column(String, nullable=True)
    beneficiary_name = Column(String, nullable=True)
    is_new_beneficiary = Column(Boolean, default=False)
    city = Column(String, nullable=True)
    country = Column(String, nullable=True)
    transaction_hour = Column(Integer, nullable=True)

    risk_score = Column(Integer, default=0)
    risk_level = Column(String, default="Low")
    risk_reasons = Column(String, default="")
    status = Column(String, default="Success")

    created_at = Column(DateTime, default=datetime.utcnow)
