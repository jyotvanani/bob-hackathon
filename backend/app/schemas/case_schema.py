"""Fraud case Pydantic schemas."""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class CaseOut(BaseModel):
    id: int
    user_id: int
    alert_id: Optional[int] = None
    risk_score: int
    case_status: str
    admin_notes: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CaseUpdateRequest(BaseModel):
    case_status: Optional[str] = None
    admin_notes: Optional[str] = None
