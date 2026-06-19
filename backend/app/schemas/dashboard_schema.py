"""Dashboard Pydantic schemas."""
from typing import List
from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_users: int
    total_logins: int
    total_transactions: int
    total_alerts: int
    high_risk_logins: int
    open_cases: int


class RiskDistributionItem(BaseModel):
    name: str
    value: int


class FraudReasonItem(BaseModel):
    reason: str
    count: int


class LoginTrendItem(BaseModel):
    date: str
    logins: int
    suspicious: int
