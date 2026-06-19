"""Real-time fake traffic simulator.

Runs a background thread that periodically inserts synthetic TrafficEvent rows
based on a mix of normal, suspicious and critical templates. Used to power the
live demo on the Fake Traffic page and the Admin Dashboard.
"""
import random
import threading
import time
from datetime import datetime
from typing import Dict, Optional

from app.database import SessionLocal
from app.models.traffic_model import TrafficEvent
from app.services.traffic_service import calculate_traffic_risk


# ---------- templates ----------

_NORMAL_TEMPLATES = [
    {
        "event_type": "login_attempt",
        "email_pool": ["jyot@example.com", "admin@example.com"],
        "ip_pool": ["192.168.1.10", "192.168.1.20", "192.168.1.55"],
        "device_pool": ["android_001", "admin_laptop_001", "iphone_22"],
        "ua_pool": [
            "Mozilla/5.0 Chrome Android",
            "Mozilla/5.0 Safari iOS",
            "Mozilla/5.0 Chrome Windows",
        ],
        "request_path": "/api/auth/login",
        "request_count": (1, 4),
        "form_completion_seconds": (40, 200),
        "otp_attempts": (0, 1),
    },
    {
        "event_type": "page_view",
        "email_pool": ["jyot@example.com"],
        "ip_pool": ["192.168.1.10"],
        "device_pool": ["android_001"],
        "ua_pool": ["Mozilla/5.0 Chrome Android"],
        "request_path": "/dashboard",
        "request_count": (1, 3),
        "form_completion_seconds": (30, 120),
        "otp_attempts": (0, 0),
    },
]

_SUSPICIOUS_TEMPLATES = [
    {
        "event_type": "onboarding_attempt",
        "email_pool": ["bot1@example.com", "bot2@example.com", "fake@example.com"],
        "ip_pool": ["45.99.88.77", "45.99.88.78"],
        "device_pool": ["bot_device_999", "bot_device_888"],
        "ua_pool": ["python-requests/2.31", "curl/8.0"],
        "request_path": "/api/onboarding/apply",
        "request_count": (15, 35),
        "form_completion_seconds": (3, 12),
        "otp_attempts": (3, 6),
    },
    {
        "event_type": "scrape_attempt",
        "email_pool": ["scraper@example.com"],
        "ip_pool": ["10.10.10.10"],
        "device_pool": ["unknown_scraper"],
        "ua_pool": ["", "unknown"],
        "request_path": "/api/transactions",
        "request_count": (12, 28),
        "form_completion_seconds": (5, 15),
        "otp_attempts": (0, 2),
    },
]

_CRITICAL_TEMPLATES = [
    {
        "event_type": "credential_stuffing",
        "email_pool": ["many-users@example.com", "victim@example.com"],
        "ip_pool": ["99.88.77.66", "45.66.77.88"],
        "device_pool": ["headless_device_777", "selenium_farm_1"],
        "ua_pool": [
            "HeadlessChrome Selenium Bot",
            "Mozilla/5.0 (HeadlessChrome) Selenium",
        ],
        "request_path": "/api/auth/login",
        "request_count": (40, 120),
        "form_completion_seconds": (1, 4),
        "otp_attempts": (6, 12),
    },
    {
        "event_type": "mass_onboarding",
        "email_pool": ["fraud-ring@example.com"],
        "ip_pool": ["45.99.88.77"],
        "device_pool": ["bot_device_999"],
        "ua_pool": ["python-requests/2.31"],
        "request_path": "/api/onboarding/apply",
        "request_count": (50, 90),
        "form_completion_seconds": (1, 4),
        "otp_attempts": (5, 10),
    },
]


def _pick(pool):
    return random.choice(pool) if pool else None


def _build_template(distribution: str) -> dict:
    """distribution: 'mixed' | 'normal' | 'attack'."""
    if distribution == "normal":
        bucket = _NORMAL_TEMPLATES
    elif distribution == "attack":
        bucket = _CRITICAL_TEMPLATES + _SUSPICIOUS_TEMPLATES
    else:  # mixed
        roll = random.random()
        if roll < 0.55:
            bucket = _NORMAL_TEMPLATES
        elif roll < 0.85:
            bucket = _SUSPICIOUS_TEMPLATES
        else:
            bucket = _CRITICAL_TEMPLATES
    t = random.choice(bucket)
    rc_lo, rc_hi = t["request_count"]
    fc_lo, fc_hi = t["form_completion_seconds"]
    ot_lo, ot_hi = t["otp_attempts"]
    return {
        "event_type": t["event_type"],
        "email": _pick(t["email_pool"]),
        "ip_address": _pick(t["ip_pool"]),
        "device_id": _pick(t["device_pool"]),
        "user_agent": _pick(t["ua_pool"]),
        "request_path": t["request_path"],
        "request_count": random.randint(rc_lo, rc_hi),
        "form_completion_seconds": random.randint(fc_lo, fc_hi),
        "otp_attempts": random.randint(ot_lo, ot_hi),
    }


# ---------- simulator singleton ----------


class TrafficSimulator:
    def __init__(self):
        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._lock = threading.Lock()
        self._running = False
        self._rate_per_sec = 1.0
        self._distribution = "mixed"
        self._started_at: Optional[float] = None
        self._events_generated = 0

    def start(self, rate_per_sec: float = 1.0, distribution: str = "mixed") -> bool:
        with self._lock:
            if self._running:
                return False
            rate_per_sec = max(0.2, min(float(rate_per_sec or 1.0), 8.0))
            if distribution not in ("mixed", "normal", "attack"):
                distribution = "mixed"
            self._stop_event.clear()
            self._rate_per_sec = rate_per_sec
            self._distribution = distribution
            self._started_at = time.time()
            self._events_generated = 0
            self._running = True
            self._thread = threading.Thread(target=self._run, daemon=True)
            self._thread.start()
            return True

    def stop(self) -> bool:
        with self._lock:
            if not self._running:
                return False
            self._stop_event.set()
            self._running = False
            return True

    def status(self) -> Dict:
        return {
            "running": self._running,
            "rate_per_sec": self._rate_per_sec,
            "distribution": self._distribution,
            "events_generated": self._events_generated,
            "started_at": (
                datetime.utcfromtimestamp(self._started_at).isoformat()
                if self._started_at
                else None
            ),
        }

    # ---------- internals ----------

    def _run(self) -> None:
        try:
            while not self._stop_event.is_set():
                interval = 1.0 / max(self._rate_per_sec, 0.2)
                self._emit_one()
                # Sleep but stay responsive to stop
                slept = 0.0
                step = 0.05
                while slept < interval and not self._stop_event.is_set():
                    time.sleep(step)
                    slept += step
        except Exception:
            # Never let the thread crash the API
            pass

    def _emit_one(self) -> None:
        from app.websocket import manager  # local import to avoid cycles
        template = _build_template(self._distribution)
        db = SessionLocal()
        try:
            score, level, reasons, action = calculate_traffic_risk(
                db=db,
                event_type=template["event_type"],
                ip_address=template["ip_address"],
                device_id=template["device_id"],
                user_agent=template["user_agent"],
                request_count=template["request_count"],
                form_completion_seconds=template["form_completion_seconds"],
                otp_attempts=template["otp_attempts"],
            )
            event = TrafficEvent(
                event_type=template["event_type"],
                email=template["email"],
                ip_address=template["ip_address"],
                device_id=template["device_id"],
                user_agent=template["user_agent"],
                request_path=template["request_path"],
                request_count=template["request_count"],
                form_completion_seconds=template["form_completion_seconds"],
                otp_attempts=template["otp_attempts"],
                risk_score=score,
                risk_level=level,
                risk_reasons=", ".join(reasons),
                action_taken=action,
            )
            db.add(event)
            db.commit()
            db.refresh(event)
            self._events_generated += 1

            # Broadcast to WS clients
            manager.broadcast_threadsafe({
                "type": "traffic_event",
                "payload": {
                    "id": event.id,
                    "event_type": event.event_type,
                    "ip_address": event.ip_address,
                    "device_id": event.device_id,
                    "user_agent": event.user_agent,
                    "request_count": event.request_count,
                    "risk_score": event.risk_score,
                    "risk_level": event.risk_level,
                    "risk_reasons": event.risk_reasons,
                    "action_taken": event.action_taken,
                    "created_at": event.created_at.isoformat() if event.created_at else None,
                    "source": "simulator",
                },
            })
        except Exception:
            db.rollback()
        finally:
            db.close()


# Module-level singleton used by the routes
simulator = TrafficSimulator()
