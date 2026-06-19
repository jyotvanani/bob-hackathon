"""KYC / Onboarding application model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime

from app.database import Base


class OnboardingApplication(Base):
    __tablename__ = "onboarding_applications"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, index=True)
    phone = Column(String, index=True)
    dob = Column(String, nullable=True)  # ISO date string for demo simplicity
    city = Column(String, nullable=True)
    country = Column(String, nullable=True)
    device_id = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    document_id = Column(String, index=True)
    document_match_score = Column(Float, default=0.0)
    selfie_match_score = Column(Float, default=0.0)
    form_completion_seconds = Column(Integer, default=0)
    otp_attempts = Column(Integer, default=0)
    risk_score = Column(Integer, default=0)
    risk_level = Column(String, default="Low")
    risk_reasons = Column(String, default="")  # comma separated
    decision = Column(String, default="Approve onboarding")
    created_at = Column(DateTime, default=datetime.utcnow)
