"""Alert Pydantic schemas."""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class AlertOut(BaseModel):
    id: int
    user_id: int
    alert_type: str
    risk_level: str
    message: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AlertUpdateRequest(BaseModel):
    status: str
