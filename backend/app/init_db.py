"""Database initialization helpers."""
from app.database import Base, engine, SessionLocal
from app import models  # noqa: F401  ensure models are registered
from app.seed.seed_data import seed_if_empty


def init_database() -> None:
    """Create tables and load seed data if empty."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
