"""Device-related logic."""
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.device_model import Device


def is_known_device(db: Session, user_id: int, device_id: str) -> bool:
    if not device_id or not user_id:
        return False
    device = db.query(Device).filter(Device.user_id == user_id, Device.device_id == device_id).first()
    return device is not None


def upsert_device(db: Session, user_id: int, device_id: str, device_name: str = None,
                  browser: str = None, os: str = None, is_trusted: bool = False) -> Device:
    """Insert or update device record."""
    device = db.query(Device).filter(Device.user_id == user_id, Device.device_id == device_id).first()
    now = datetime.utcnow()
    if device:
        device.last_seen = now
        if device_name:
            device.device_name = device_name
        if browser:
            device.browser = browser
        if os:
            device.os = os
    else:
        device = Device(
            user_id=user_id,
            device_id=device_id,
            device_name=device_name,
            browser=browser,
            os=os,
            is_trusted=is_trusted,
            first_seen=now,
            last_seen=now,
        )
        db.add(device)
    db.commit()
    db.refresh(device)
    return device
