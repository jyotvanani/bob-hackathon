"""Time-related helpers."""
from datetime import datetime


def is_night_hour(hour: int) -> bool:
    """Return True if the hour is between 12 AM (0) and 5 AM (5 inclusive lower)."""
    if hour is None:
        return False
    return 0 <= hour < 5


def is_outside_usual_hours(hour: int, start: int, end: int) -> bool:
    """True if hour is outside [start, end]."""
    if hour is None or start is None or end is None:
        return False
    if start <= end:
        return not (start <= hour <= end)
    # wrap-around case (e.g. 22 to 6)
    return not (hour >= start or hour <= end)


def now_utc() -> datetime:
    return datetime.utcnow()
