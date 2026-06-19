"""Models package - import all models so SQLAlchemy registers them."""
from app.models.user_model import User
from app.models.device_model import Device
from app.models.login_model import LoginEvent
from app.models.transaction_model import Transaction
from app.models.alert_model import Alert
from app.models.case_model import FraudCase

__all__ = [
    "User",
    "Device",
    "LoginEvent",
    "Transaction",
    "Alert",
    "FraudCase",
]
