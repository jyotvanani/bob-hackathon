"""Seed demo data for hackathon."""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.user_model import User
from app.models.device_model import Device
from app.models.login_model import LoginEvent
from app.models.transaction_model import Transaction
from app.models.alert_model import Alert
from app.models.case_model import FraudCase


def seed_if_empty(db: Session) -> None:
    """Insert demo data only if users table is empty."""
    if db.query(User).count() > 0:
        return

    # ---- Users ----
    customer = User(
        name="Jyot Vanani",
        email="jyot@example.com",
        password="123456",
        phone="9876543210",
        role="customer",
        usual_city="Surat",
        usual_country="India",
        usual_device_id="android_001",
        usual_login_start_hour=8,
        usual_login_end_hour=22,
        average_transaction_amount=5000.0,
    )
    admin = User(
        name="Admin User",
        email="admin@example.com",
        password="admin123",
        phone="9000000000",
        role="admin",
        usual_city="Ahmedabad",
        usual_country="India",
        usual_device_id="admin_laptop_001",
        usual_login_start_hour=9,
        usual_login_end_hour=18,
        average_transaction_amount=10000.0,
    )
    db.add_all([customer, admin])
    db.commit()
    db.refresh(customer)
    db.refresh(admin)

    # ---- Devices ----
    now = datetime.utcnow()
    devices = [
        Device(
            user_id=customer.id,
            device_id="android_001",
            device_name="Samsung Android",
            browser="Chrome",
            os="Android",
            is_trusted=True,
            first_seen=now - timedelta(days=30),
            last_seen=now,
        ),
        Device(
            user_id=admin.id,
            device_id="admin_laptop_001",
            device_name="Admin Laptop",
            browser="Chrome",
            os="Windows",
            is_trusted=True,
            first_seen=now - timedelta(days=60),
            last_seen=now,
        ),
    ]
    db.add_all(devices)
    db.commit()

    # ---- Login Events ----
    login_events = [
        LoginEvent(
            user_id=customer.id, email=customer.email, device_id="android_001",
            browser="Chrome", os="Android", ip_address="192.168.1.10",
            city="Surat", country="India", login_hour=11, is_successful=True,
            risk_score=10, risk_level="Low",
            risk_reasons="Known device, Known location, Normal login time",
            recommended_action="Allow login",
            created_at=now - timedelta(days=2, hours=3),
        ),
        LoginEvent(
            user_id=customer.id, email=customer.email, device_id="windows_555",
            browser="Edge", os="Windows", ip_address="103.21.45.10",
            city="Ahmedabad", country="India", login_hour=21, is_successful=True,
            risk_score=45, risk_level="Medium",
            risk_reasons="New / unknown device, Unusual city",
            recommended_action="Step-up verification required",
            created_at=now - timedelta(days=1, hours=5),
        ),
        LoginEvent(
            user_id=customer.id, email=customer.email, device_id="windows_999",
            browser="Edge", os="Windows", ip_address="10.10.10.10",
            city="Delhi", country="India", login_hour=2, is_successful=True,
            risk_score=70, risk_level="High",
            risk_reasons="New / unknown device, Unusual city, Night login (12 AM - 5 AM)",
            recommended_action="Block login and alert fraud team",
            created_at=now - timedelta(hours=18),
        ),
        LoginEvent(
            user_id=customer.id, email=customer.email, device_id="linux_unknown_777",
            browser="Firefox", os="Linux", ip_address="45.99.88.77",
            city="Unknown", country="Russia", login_hour=3, is_successful=False,
            risk_score=95, risk_level="Critical",
            risk_reasons="Failed login attempt / wrong password, New / unknown device, Unusual city, Unusual country, Night login (12 AM - 5 AM), Suspicious IP",
            recommended_action="Block account temporarily and create fraud case",
            created_at=now - timedelta(hours=4),
        ),
        LoginEvent(
            user_id=admin.id, email=admin.email, device_id="admin_laptop_001",
            browser="Chrome", os="Windows", ip_address="192.168.1.20",
            city="Ahmedabad", country="India", login_hour=10, is_successful=True,
            risk_score=5, risk_level="Low",
            risk_reasons="Known device, Known location, Normal login time",
            recommended_action="Allow login",
            created_at=now - timedelta(hours=2),
        ),
    ]
    db.add_all(login_events)
    db.commit()

    # ---- Transactions ----
    transactions = [
        Transaction(
            user_id=customer.id, amount=1000.0, beneficiary_id="BEN001",
            beneficiary_name="Known Receiver", is_new_beneficiary=False,
            city="Surat", country="India", transaction_hour=14,
            risk_score=5, risk_level="Low", risk_reasons="No risk signals detected",
            status="Success", created_at=now - timedelta(days=1, hours=10),
        ),
        Transaction(
            user_id=customer.id, amount=90000.0, beneficiary_id="BEN999",
            beneficiary_name="Unknown Receiver", is_new_beneficiary=True,
            city="Delhi", country="India", transaction_hour=2,
            risk_score=85,
            risk_level="High",
            risk_reasons="Amount much higher than user's usual, High transaction amount (> 50,000), New beneficiary, Unusual transaction time (night), Unusual transaction city",
            status="Blocked", created_at=now - timedelta(hours=12),
        ),
        Transaction(
            user_id=customer.id, amount=150000.0, beneficiary_id="BEN777",
            beneficiary_name="Foreign Receiver", is_new_beneficiary=True,
            city="Unknown", country="Russia", transaction_hour=3,
            risk_score=100,
            risk_level="Critical",
            risk_reasons="Amount much higher than user's usual, Very high transaction amount (> 100,000), New beneficiary, Unusual transaction time (night), Unusual transaction city, Unusual transaction country",
            status="Blocked", created_at=now - timedelta(hours=3),
        ),
    ]
    db.add_all(transactions)
    db.commit()

    # ---- Alerts ----
    alerts = [
        Alert(
            user_id=customer.id, alert_type="Login", risk_level="Medium",
            message="Login from new device in Ahmedabad", status="Open",
            created_at=now - timedelta(days=1, hours=5),
        ),
        Alert(
            user_id=customer.id, alert_type="Login", risk_level="High",
            message="Night login from Delhi on new device", status="Open",
            created_at=now - timedelta(hours=18),
        ),
        Alert(
            user_id=customer.id, alert_type="Login", risk_level="Critical",
            message="Foreign login attempt with wrong password", status="Open",
            created_at=now - timedelta(hours=4),
        ),
        Alert(
            user_id=customer.id, alert_type="Transaction", risk_level="High",
            message="High value transfer to new beneficiary at night",
            status="Reviewing", created_at=now - timedelta(hours=12),
        ),
        Alert(
            user_id=customer.id, alert_type="Transaction", risk_level="Critical",
            message="Foreign transfer of 1.5L to unknown receiver",
            status="Open", created_at=now - timedelta(hours=3),
        ),
    ]
    db.add_all(alerts)
    db.commit()
    for a in alerts:
        db.refresh(a)

    # ---- Fraud Cases ----
    cases = [
        FraudCase(
            user_id=customer.id, alert_id=alerts[1].id, risk_score=70,
            case_status="Pending", admin_notes="",
            created_at=now - timedelta(hours=18),
            updated_at=now - timedelta(hours=18),
        ),
        FraudCase(
            user_id=customer.id, alert_id=alerts[2].id, risk_score=95,
            case_status="Under Review",
            admin_notes="Customer verification call scheduled",
            created_at=now - timedelta(hours=4),
            updated_at=now - timedelta(hours=2),
        ),
        FraudCase(
            user_id=customer.id, alert_id=alerts[4].id, risk_score=100,
            case_status="Pending", admin_notes="",
            created_at=now - timedelta(hours=3),
            updated_at=now - timedelta(hours=3),
        ),
    ]
    db.add_all(cases)
    db.commit()
