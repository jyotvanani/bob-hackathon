"""KYC / Onboarding risk scoring engine."""
from datetime import date, datetime
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user_model import User
from app.models.onboarding_model import OnboardingApplication


def _level_from_score(score: int) -> str:
    if score <= 30:
        return "Low"
    if score <= 60:
        return "Medium"
    if score <= 85:
        return "High"
    return "Critical"


def _decision_for(level: str) -> str:
    return {
        "Low": "Approve onboarding",
        "Medium": "Ask additional verification",
        "High": "Send to manual review",
        "Critical": "Reject onboarding and block source",
    }.get(level, "Approve onboarding")


def _calc_age(dob_str: Optional[str]) -> Optional[int]:
    """Parse YYYY-MM-DD and return age in years."""
    if not dob_str:
        return None
    try:
        dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
    except ValueError:
        return None
    today = date.today()
    years = today.year - dob.year
    if (today.month, today.day) < (dob.month, dob.day):
        years -= 1
    return years


def calculate_onboarding_risk(
    db: Session,
    full_name: str,
    email: str,
    phone: str,
    dob: Optional[str],
    city: Optional[str],
    country: Optional[str],
    device_id: Optional[str],
    ip_address: Optional[str],
    document_id: Optional[str],
    document_match_score: float,
    selfie_match_score: float,
    form_completion_seconds: int,
    otp_attempts: int,
) -> Tuple[int, str, List[str], str]:
    """Return (score, level, reasons, decision)."""
    score = 0
    reasons: List[str] = []
    positive_signals: List[str] = []

    # ----- Duplicates -----
    duplicate_doc_id = False

    if email:
        in_users = db.query(User).filter(User.email == email).first() is not None
        in_apps = (
            db.query(OnboardingApplication)
            .filter(OnboardingApplication.email == email)
            .first()
            is not None
        )
        if in_users or in_apps:
            score += 25
            reasons.append("Duplicate email already exists")

    if phone:
        in_users = db.query(User).filter(User.phone == phone).first() is not None
        in_apps = (
            db.query(OnboardingApplication)
            .filter(OnboardingApplication.phone == phone)
            .first()
            is not None
        )
        if in_users or in_apps:
            score += 25
            reasons.append("Duplicate phone already exists")

    if document_id:
        in_apps = (
            db.query(OnboardingApplication)
            .filter(OnboardingApplication.document_id == document_id)
            .first()
            is not None
        )
        if in_apps:
            score += 35
            reasons.append("Duplicate document ID already exists")
            duplicate_doc_id = True

    # ----- Same device / IP usage -----
    if device_id:
        device_count = (
            db.query(func.count(OnboardingApplication.id))
            .filter(OnboardingApplication.device_id == device_id)
            .scalar()
            or 0
        )
        if device_count > 3:
            score += 25
            reasons.append("Same device used for many onboarding applications")

    if ip_address:
        ip_count = (
            db.query(func.count(OnboardingApplication.id))
            .filter(OnboardingApplication.ip_address == ip_address)
            .scalar()
            or 0
        )
        if ip_count > 5:
            score += 25
            reasons.append("Same IP used for many onboarding applications")

    # ----- Document / selfie scores -----
    if document_match_score is not None:
        if document_match_score < 60:
            score += 25
            reasons.append("Document verification score is low")
        if document_match_score < 40:
            score += 40
            reasons.append("Document verification score is critically low")
        if document_match_score >= 80:
            positive_signals.append("Document verification score is good")

    if selfie_match_score is not None:
        if selfie_match_score < 60:
            score += 25
            reasons.append("Selfie match score is low")
        if selfie_match_score < 40:
            score += 40
            reasons.append("Selfie match score is critically low")
        if selfie_match_score >= 80:
            positive_signals.append("Selfie match score is good")

    # ----- Form completion timing -----
    if form_completion_seconds is not None:
        if form_completion_seconds < 20:
            score += 20
            reasons.append("Form submitted suspiciously fast")
        if form_completion_seconds < 10:
            score += 30
            reasons.append("Form submitted in under 10 seconds (likely bot)")
        if form_completion_seconds >= 60:
            positive_signals.append("Normal form completion time")

    # ----- OTP attempts -----
    if otp_attempts is not None:
        if otp_attempts > 3:
            score += 20
            reasons.append("Too many OTP attempts")
        if otp_attempts > 5:
            score += 30
            reasons.append("Excessive OTP attempts (possible brute force)")

    # ----- Age check -----
    age = _calc_age(dob)
    if age is not None and age < 18:
        score += 25
        reasons.append("Applicant is below 18 years old")

    # ----- Country check -----
    if country and country.strip().lower() != "india":
        score += 25
        reasons.append("Onboarding from outside India")

    # ----- Combined doc + selfie penalty -----
    if (
        document_match_score is not None
        and selfie_match_score is not None
        and document_match_score < 40
        and selfie_match_score < 40
    ):
        score += 15
        reasons.append("Both document and selfie scores are critically low")

    # Cap score at 100
    if score > 100:
        score = 100

    level = _level_from_score(score)

    # Duplicate document_id forces at least High
    if duplicate_doc_id and level in ("Low", "Medium"):
        level = "High"

    if not reasons:
        reasons = positive_signals if positive_signals else ["No risk signals detected"]

    decision = _decision_for(level)
    return score, level, reasons, decision
