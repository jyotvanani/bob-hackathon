"""KYC / Onboarding Pydantic schemas."""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


class OnboardingCreate(BaseModel):
    full_name: str
    email: str
    phone: str
    dob: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    device_id: Optional[str] = None
    ip_address: Optional[str] = None
    document_id: Optional[str] = None
    document_match_score: Optional[float] = 0.0
    selfie_match_score: Optional[float] = 0.0
    form_completion_seconds: Optional[int] = 0
    otp_attempts: Optional[int] = 0


class OnboardingCreateResponse(BaseModel):
    success: bool
    application_id: int
    risk_score: int
    risk_level: str
    risk_reasons: List[str]
    decision: str


class OnboardingOut(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str
    dob: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    device_id: Optional[str] = None
    ip_address: Optional[str] = None
    document_id: Optional[str] = None
    document_match_score: float
    selfie_match_score: float
    form_completion_seconds: int
    otp_attempts: int
    risk_score: int
    risk_level: str
    risk_reasons: str
    decision: str
    created_at: datetime

    class Config:
        from_attributes = True


class OnboardingUpdateRequest(BaseModel):
    decision: Optional[str] = None
    risk_level: Optional[str] = None
