"""Fake / bot traffic risk scoring engine."""
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.traffic_model import TrafficEvent


SUSPICIOUS_UA_TOKENS = ("python-requests", "selenium", "headless", "bot")


def _level_from_score(score: int) -> str:
    if score <= 30:
        return "Low"
    if score <= 60:
        return "Medium"
    if score <= 85:
        return "High"
    return "Critical"


def _action_for(level: str) -> str:
    return {
        "Low": "Allow traffic",
        "Medium": "Rate limit request",
        "High": "Challenge with CAPTCHA or step-up verification",
        "Critical": "Block IP/device temporarily",
    }.get(level, "Allow traffic")


def calculate_traffic_risk(
    db: Session,
    event_type: Optional[str],
    ip_address: Optional[str],
    device_id: Optional[str],
    user_agent: Optional[str],
    request_count: int,
    form_completion_seconds: int,
    otp_attempts: int,
) -> Tuple[int, str, List[str], str]:
    """Return (score, level, reasons, action_taken)."""
    score = 0
    reasons: List[str] = []
    suspicious_ua = False

    request_count = request_count or 0
    form_completion_seconds = form_completion_seconds or 0
    otp_attempts = otp_attempts or 0

    # ----- Request frequency -----
    if request_count > 10:
        score += 20
        reasons.append("High request frequency detected")
    if request_count > 25:
        score += 35
        reasons.append("Very high request frequency (>25)")
    if request_count > 50:
        score += 50
        reasons.append("Extreme request frequency (>50)")

    # ----- Repeat IP / device -----
    if ip_address:
        ip_events = (
            db.query(func.count(TrafficEvent.id))
            .filter(TrafficEvent.ip_address == ip_address)
            .scalar()
            or 0
        )
        if ip_events > 10:
            score += 25
            reasons.append("Same IP seen across many traffic events")

    if device_id:
        device_events = (
            db.query(func.count(TrafficEvent.id))
            .filter(TrafficEvent.device_id == device_id)
            .scalar()
            or 0
        )
        if device_events > 10:
            score += 25
            reasons.append("Same device seen across many traffic events")

    # ----- Form completion time -----
    if form_completion_seconds and form_completion_seconds < 10:
        score += 25
        reasons.append("Very fast form submission")
    if form_completion_seconds and form_completion_seconds < 5:
        score += 35
        reasons.append("Form submitted in under 5 seconds (likely bot)")

    # ----- OTP attempts -----
    if otp_attempts > 3:
        score += 20
        reasons.append("Multiple OTP failures")
    if otp_attempts > 5:
        score += 30
        reasons.append("Excessive OTP failures (possible brute force)")

    # ----- User agent inspection -----
    ua = (user_agent or "").lower().strip()
    if ua == "" or ua in ("unknown", "n/a"):
        score += 20
        reasons.append("Empty or unknown user-agent")
        suspicious_ua = True
    else:
        if "python-requests" in ua:
            score += 30
            reasons.append("Suspicious automated user-agent (python-requests)")
            suspicious_ua = True
        if "selenium" in ua:
            score += 30
            reasons.append("Suspicious automated user-agent (selenium)")
            suspicious_ua = True
        if "headless" in ua:
            score += 30
            reasons.append("Suspicious automated user-agent (headless browser)")
            suspicious_ua = True
        if "bot" in ua and "selenium" not in ua and "headless" not in ua:
            # avoid double-counting if the same UA was already flagged
            score += 25
            reasons.append("Suspicious automated user-agent (bot)")
            suspicious_ua = True

    # ----- Combined penalties -----
    if suspicious_ua and request_count > 25:
        score += 15
        reasons.append("Suspicious user-agent with very high request rate")

    if event_type == "credential_stuffing" and request_count > 25:
        score += 20
        reasons.append("Credential-stuffing pattern detected")

    if score > 100:
        score = 100

    if not reasons:
        reasons = ["No suspicious traffic signals"]

    level = _level_from_score(score)
    action = _action_for(level)
    return score, level, reasons, action
