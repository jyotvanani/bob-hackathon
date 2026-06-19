"""Traffic event Pydantic schemas."""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


class TrafficAnalyzeRequest(BaseModel):
    event_type: Optional[str] = "generic"
    email: Optional[str] = None
    ip_address: Optional[str] = None
    device_id: Optional[str] = None
    user_agent: Optional[str] = None
    request_path: Optional[str] = None
    request_count: Optional[int] = 0
    form_completion_seconds: Optional[int] = 0
    otp_attempts: Optional[int] = 0


class TrafficAnalyzeResponse(BaseModel):
    success: bool
    event_id: int
    risk_score: int
    risk_level: str
    risk_reasons: List[str]
    action_taken: str


class TrafficEventOut(BaseModel):
    id: int
    event_type: str
    email: Optional[str] = None
    ip_address: Optional[str] = None
    device_id: Optional[str] = None
    user_agent: Optional[str] = None
    request_path: Optional[str] = None
    request_count: int
    form_completion_seconds: int
    otp_attempts: int
    risk_score: int
    risk_level: str
    risk_reasons: str
    action_taken: str
    created_at: datetime

    class Config:
        from_attributes = True


class TrafficSummary(BaseModel):
    total_events: int
    high_risk_events: int
    critical_events: int
    blocked_events: int
