"""Risk scoring engine - rule based."""
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session

from app.models.user_model import User
from app.services import device_service, location_service
from app.utils.time_utils import is_night_hour, is_outside_usual_hours


def _level_from_score(score: int) -> str:
    if score <= 30:
        return "Low"
    if score <= 60:
        return "Medium"
    if score <= 85:
        return "High"
    return "Critical"


def _login_action(level: str) -> str:
    return {
        "Low": "Allow login",
        "Medium": "Step-up verification required",
        "High": "Block login and alert fraud team",
        "Critical": "Block account temporarily and create fraud case",
    }.get(level, "Allow login")


def _txn_action(level: str) -> str:
    return {
        "Low": "Process transaction",
        "Medium": "Ask OTP or face verification",
        "High": "Block transaction and send to fraud review",
        "Critical": "Block transaction and freeze suspicious session",
    }.get(level, "Process transaction")


def _txn_status(level: str) -> str:
    return {
        "Low": "Success",
        "Medium": "Verification Required",
        "High": "Blocked",
        "Critical": "Blocked",
    }.get(level, "Success")


def calculate_login_risk(
    db: Session,
    user: Optional[User],
    device_id: Optional[str],
    city: Optional[str],
    country: Optional[str],
    login_hour: Optional[int],
    ip_address: Optional[str],
    failed_attempt: bool = False,
) -> Tuple[int, str, List[str], str]:
    """Return (score, level, reasons, recommended_action)."""
    score = 0
    reasons: List[str] = []
    positive_signals: List[str] = []

    # Unknown user
    if user is None:
        score += 30
        reasons.append("Unknown user email")

    # Failed login
    if failed_attempt:
        score += 20
        reasons.append("Failed login attempt / wrong password")

    # New device check
    if user and device_id:
        if device_service.is_known_device(db, user.id, device_id):
            positive_signals.append("Known device")
        else:
            score += 25
            reasons.append("New / unknown device")
    elif device_id is None:
        # no device id provided, treat as new device softly
        score += 10
        reasons.append("Missing device information")

    # Location checks
    if user and city:
        if location_service.is_unusual_city(user, city):
            score += 20
            reasons.append("Unusual city")
        else:
            positive_signals.append("Known location")

    if user and country:
        if location_service.is_unusual_country(user, country):
            score += 25
            reasons.append("Unusual country")

    # Login time checks
    if login_hour is not None:
        if is_night_hour(login_hour):
            score += 15
            reasons.append("Night login (12 AM - 5 AM)")
        elif user and is_outside_usual_hours(login_hour, user.usual_login_start_hour, user.usual_login_end_hour):
            score += 10
            reasons.append("Login outside usual hours")
        else:
            positive_signals.append("Normal login time")

    # IP suspicion
    if ip_address and location_service.is_suspicious_ip(ip_address):
        score += 10
        reasons.append("Suspicious IP")

    # Cap at 100
    if score > 100:
        score = 100

    # If nothing flagged, surface positive signals
    if not reasons:
        reasons = positive_signals if positive_signals else ["No risk signals detected"]

    level = _level_from_score(score)
    action = _login_action(level)
    return score, level, reasons, action


def calculate_transaction_risk(
    user: Optional[User],
    amount: float,
    is_new_beneficiary: bool,
    city: Optional[str],
    country: Optional[str],
    transaction_hour: Optional[int],
) -> Tuple[int, str, List[str], str, str]:
    """Return (score, level, reasons, status, recommended_action)."""
    score = 0
    reasons: List[str] = []

    avg_amount = user.average_transaction_amount if user and user.average_transaction_amount else 5000.0

    if amount and amount > avg_amount * 3:
        score += 25
        reasons.append("Amount much higher than user's usual")

    if amount and amount > 50000:
        score += 20
        reasons.append("High transaction amount (> 50,000)")

    if amount and amount > 100000:
        score += 30
        reasons.append("Very high transaction amount (> 100,000)")

    if is_new_beneficiary:
        score += 25
        reasons.append("New beneficiary")

    if transaction_hour is not None and is_night_hour(transaction_hour):
        score += 15
        reasons.append("Unusual transaction time (night)")

    if user and city and location_service.is_unusual_city(user, city):
        score += 15
        reasons.append("Unusual transaction city")

    if user and country and location_service.is_unusual_country(user, country):
        score += 25
        reasons.append("Unusual transaction country")

    if score > 100:
        score = 100

    if not reasons:
        reasons = ["No risk signals detected"]

    level = _level_from_score(score)
    status = _txn_status(level)
    action = _txn_action(level)
    return score, level, reasons, status, action


# Public helpers used by routes
def login_action_for(level: str) -> str:
    return _login_action(level)


def transaction_action_for(level: str) -> str:
    return _txn_action(level)


def transaction_status_for(level: str) -> str:
    return _txn_status(level)


def level_from_score(score: int) -> str:
    return _level_from_score(score)
