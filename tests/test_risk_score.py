"""Tests for the rule-based risk engine."""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "backend"))

from app.services import risk_service  # noqa: E402


class FakeUser:
    id = 1
    usual_city = "Surat"
    usual_country = "India"
    usual_login_start_hour = 8
    usual_login_end_hour = 22
    average_transaction_amount = 5000.0


def test_transaction_low_risk():
    user = FakeUser()
    score, level, reasons, status, action = risk_service.calculate_transaction_risk(
        user=user,
        amount=1000,
        is_new_beneficiary=False,
        city="Surat",
        country="India",
        transaction_hour=14,
    )
    assert level == "Low"
    assert status == "Success"
    assert score <= 30


def test_transaction_high_risk():
    user = FakeUser()
    score, level, reasons, status, action = risk_service.calculate_transaction_risk(
        user=user,
        amount=90000,
        is_new_beneficiary=True,
        city="Delhi",
        country="India",
        transaction_hour=2,
    )
    assert level in ("High", "Critical")
    assert status == "Blocked"
    assert score >= 61


def test_transaction_critical_foreign():
    user = FakeUser()
    score, level, reasons, status, action = risk_service.calculate_transaction_risk(
        user=user,
        amount=150000,
        is_new_beneficiary=True,
        city="Unknown",
        country="Russia",
        transaction_hour=3,
    )
    assert level == "Critical"
    assert status == "Blocked"
    assert score >= 86
