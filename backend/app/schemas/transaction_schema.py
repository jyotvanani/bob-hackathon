"""Transaction Pydantic schemas."""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


class TransactionCreate(BaseModel):
    user_id: int
    amount: float
    beneficiary_id: Optional[str] = None
    beneficiary_name: Optional[str] = None
    is_new_beneficiary: Optional[bool] = False
    city: Optional[str] = None
    country: Optional[str] = None
    transaction_hour: Optional[int] = None


class TransactionCreateResponse(BaseModel):
    success: bool
    transaction_id: int
    risk_score: int
    risk_level: str
    risk_reasons: List[str]
    status: str
    recommended_action: str


class TransactionOut(BaseModel):
    id: int
    user_id: int
    amount: float
    beneficiary_id: Optional[str] = None
    beneficiary_name: Optional[str] = None
    is_new_beneficiary: bool
    city: Optional[str] = None
    country: Optional[str] = None
    transaction_hour: Optional[int] = None
    risk_score: int
    risk_level: str
    risk_reasons: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
