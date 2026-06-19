"""Location/geo helpers (placeholder, no real geo API)."""
from app.models.user_model import User


def is_unusual_city(user: User, city: str) -> bool:
    if not city or not user or not user.usual_city:
        return False
    return city.strip().lower() != user.usual_city.strip().lower()


def is_unusual_country(user: User, country: str) -> bool:
    if not country or not user or not user.usual_country:
        return False
    return country.strip().lower() != user.usual_country.strip().lower()


def is_suspicious_ip(ip_address: str) -> bool:
    """Placeholder rule: treat non-private IPs that are not local-ish as suspicious."""
    if not ip_address:
        return False
    private_prefixes = ("192.168.", "10.", "172.16.", "127.")
    if ip_address.startswith(private_prefixes):
        return False
    return True
