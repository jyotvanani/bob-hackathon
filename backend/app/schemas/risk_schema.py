"""Risk-related Pydantic schemas."""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


class AnalyzeLoginRequest(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None
    device_id: Optional[str] = None
    device_name: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None
    ip_address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    login_hour: Optional[int] = None
    failed_attempt: Optional[bool] = False


class AnalyzeLoginResponse(BaseModel):
    risk_score: int
    risk_level: str
    risk_reasons: List[str]
    recommended_action: str


class RiskHistoryItem(BaseModel):
    id: int
    risk_score: int
    risk_level: str
    city: Optional[str] = None
    device_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RiskHistoryResponse(BaseModel):
    user_id: int
    history: List[RiskHistoryItem]
