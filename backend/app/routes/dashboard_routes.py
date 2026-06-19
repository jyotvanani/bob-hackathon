"""Dashboard aggregation routes."""
from collections import Counter
from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user_model import User
from app.models.login_model import LoginEvent
from app.models.transaction_model import Transaction
from app.models.alert_model import Alert
from app.models.case_model import FraudCase
from app.schemas.dashboard_schema import (
    DashboardSummary,
    RiskDistributionItem,
    FraudReasonItem,
    LoginTrendItem,
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def summary(db: Session = Depends(get_db)):
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_logins = db.query(func.count(LoginEvent.id)).scalar() or 0
    total_transactions = db.query(func.count(Transaction.id)).scalar() or 0
    total_alerts = db.query(func.count(Alert.id)).scalar() or 0
    high_risk_logins = (
        db.query(func.count(LoginEvent.id))
        .filter(LoginEvent.risk_level.in_(["High", "Critical"]))
        .scalar()
        or 0
    )
    open_cases = (
        db.query(func.count(FraudCase.id))
        .filter(FraudCase.case_status.in_(["Pending", "Under Review"]))
        .scalar()
        or 0
    )
    return DashboardSummary(
        total_users=total_users,
        total_logins=total_logins,
        total_transactions=total_transactions,
        total_alerts=total_alerts,
        high_risk_logins=high_risk_logins,
        open_cases=open_cases,
    )


@router.get("/risk-distribution", response_model=List[RiskDistributionItem])
def risk_distribution(db: Session = Depends(get_db)):
    levels = ["Low", "Medium", "High", "Critical"]
    result = []
    for lvl in levels:
        count = (
            db.query(func.count(LoginEvent.id))
            .filter(LoginEvent.risk_level == lvl)
            .scalar()
            or 0
        )
        result.append(RiskDistributionItem(name=lvl, value=count))
    return result


@router.get("/fraud-reasons", response_model=List[FraudReasonItem])
def fraud_reasons(db: Session = Depends(get_db)):
    counter: Counter = Counter()

    for ev in db.query(LoginEvent).all():
        if not ev.risk_reasons:
            continue
        for r in [x.strip() for x in ev.risk_reasons.split(",")]:
            if r and r != "No risk signals detected":
                counter[r] += 1

    for txn in db.query(Transaction).all():
        if not txn.risk_reasons:
            continue
        for r in [x.strip() for x in txn.risk_reasons.split(",")]:
            if r and r != "No risk signals detected":
                counter[r] += 1

    items = [FraudReasonItem(reason=r, count=c) for r, c in counter.most_common(10)]
    return items


@router.get("/login-trends", response_model=List[LoginTrendItem])
def login_trends(db: Session = Depends(get_db)):
    today = datetime.utcnow().date()
    start_date = today - timedelta(days=6)
    trends = []
    for i in range(7):
        d = start_date + timedelta(days=i)
        d_start = datetime(d.year, d.month, d.day)
        d_end = d_start + timedelta(days=1)
        logins = (
            db.query(func.count(LoginEvent.id))
            .filter(LoginEvent.created_at >= d_start, LoginEvent.created_at < d_end)
            .scalar()
            or 0
        )
        suspicious = (
            db.query(func.count(LoginEvent.id))
            .filter(
                LoginEvent.created_at >= d_start,
                LoginEvent.created_at < d_end,
                LoginEvent.risk_level.in_(["Medium", "High", "Critical"]),
            )
            .scalar()
            or 0
        )
        trends.append(LoginTrendItem(date=d.isoformat(), logins=logins, suspicious=suspicious))
    return trends
