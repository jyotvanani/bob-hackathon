"""Smoke test for backend imports and health endpoint."""
import os
import sys

# Allow running from project root
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "backend"))


def test_app_import_and_health():
    from main import app  # noqa: F401
    # FastAPI test without httpx: walk routes to find /api/health
    paths = [r.path for r in app.routes]
    assert "/" in paths
    assert "/api/health" in paths
