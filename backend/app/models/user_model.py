"""User model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)  # plain for demo only
    phone = Column(String, nullable=True)
    role = Column(String, default="customer")  # customer or admin

    usual_city = Column(String, nullable=True)
    usual_country = Column(String, nullable=True)
    usual_device_id = Column(String, nullable=True)
    usual_login_start_hour = Column(Integer, default=8)
    usual_login_end_hour = Column(Integer, default=22)
    average_transaction_amount = Column(Float, default=5000.0)

    created_at = Column(DateTime, default=datetime.utcnow)
