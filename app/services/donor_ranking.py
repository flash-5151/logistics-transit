from sqlalchemy import select, func
from app.models.user import User
from app.models.donation import Donation
from app.models.enums import UserRole


class DonorRankingService:

    def __init__(self, db):
        self.db = db

    async def rank_donors(self):

        result = await self.db.execute(
            select(User).where(User.role == UserRole.DONOR)
        )

        donors = result.scalars().all()

        ranked = []

        for donor in donors:

            donation_result = await self.db.execute(
                select(func.count(Donation.id))
                .where(Donation.donor_id == donor.id)
            )

            donation_count = donation_result.scalar() or 0

            score = 0

            # Active donor
            if donor.is_active:
                score += 40

            # Donation history
            score += donation_count * 20

            # Contact information
            if donor.phone_number:
                score += 20

            if donor.address:
                score += 20

            ranked.append({
                "name": donor.full_name,
                "email": donor.email,
                "donations": donation_count,
                "score": score,
                "reason": (
                    f"Active donor with "
                    f"{donation_count} previous donations"
                )
            })

        ranked.sort(
            key=lambda x: x["score"],
            reverse=True
        )

        return ranked