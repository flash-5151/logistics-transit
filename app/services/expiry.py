from datetime import datetime, timedelta
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.repositories.inventory import InventoryRepository
from app.models.inventory import BloodInventory


class ExpiryService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.inventory_repo = InventoryRepository(db)

    async def get_expiring_inventory(
        self,
        threshold_days: int = 7
    ) -> List[BloodInventory]:

        threshold_date = (
            datetime.utcnow() +
            timedelta(days=threshold_days)
        )

        query = select(BloodInventory).where(
            BloodInventory.expiry_date <= threshold_date
        )

        result = await self.db.execute(query)

        return list(result.scalars().all())

    async def check_for_expiry_alerts(self):

        expiring = await self.get_expiring_inventory()

        alerts = []

        for item in expiring:

            days_remaining = (
                item.expiry_date - datetime.utcnow()
            ).days

            if days_remaining <= 1:
                risk = "HIGH"
                action = "Transfer immediately to nearby hospitals"

            elif days_remaining <= 3:
                risk = "MEDIUM"
                action = "Prioritize usage before expiry"

            else:
                risk = "LOW"
                action = "Monitor inventory"

            alerts.append({
                "blood_group": item.blood_group.value,
                "quantity_ml": item.quantity_ml,
                "days_remaining": days_remaining,
                "risk_level": risk,
                "recommended_action": action,
                "blood_bank_id": str(item.blood_bank_id)
            })

        return {
            "total_alerts": len(alerts),
            "items": alerts
        }