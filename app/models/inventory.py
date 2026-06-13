from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.enums import BloodGroup
from datetime import datetime


class BloodInventory(Base):
    __tablename__ = "blood_inventory"

    blood_bank_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    blood_group = Column(Enum(BloodGroup), nullable=False)
    quantity_ml = Column(Integer, default=0)
    expiry_date = Column(DateTime, nullable=False)
    location = Column(String, nullable=True, default="Fridge-A1")
    
    blood_bank = relationship("User", backref="inventory")
