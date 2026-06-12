from sqlalchemy import select
from app.models.inventory import BloodInventory

class PredictionService:

    def __init__(self, db):
        self.db = db

    async def predict_shortage(self):

        result = await self.db.execute(
            select(BloodInventory)
        )

        inventory = result.scalars().all()

        total_stock = {}

        for item in inventory:
            bg = item.blood_group

            if bg not in total_stock:
                total_stock[bg] = 0

            total_stock[bg] += item.quantity_ml

        high_risk = []

        for bg, qty in total_stock.items():

            if qty < 100:
                high_risk.append(bg.value)
        return {
        "total_stock": total_stock,
        "high_risk_groups": high_risk,
        "recommendation":
            "Increase donation drives for high-risk blood groups"
            if high_risk
            else
            "Inventory levels are healthy"
}   