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
    total_onboarding_applications: int = 0
    high_risk_onboarding_applications: int = 0
    total_traffic_events: int = 0
    critical_traffic_events: int = 0


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
    traffic: int = 0
