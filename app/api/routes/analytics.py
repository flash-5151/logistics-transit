from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user, RoleChecker
from app.db.session import get_db
from app.models.enums import UserRole
from app.services.expiry import ExpiryService
from app.services.prediction import PredictionService
from app.services.donor_ranking import DonorRankingService

router = APIRouter()
allow_admin = RoleChecker([UserRole.ADMIN])


@router.get("/shortage-prediction")
async def shortage_prediction(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # AI Prediction Integration Placeholder
    prediction_service = PredictionService(db)

    result = await prediction_service.predict_shortage()

    return {
        " status": "success",
        "data": result
    }


@router.get("/heatmap")
async def shortage_heatmap(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Analytics Heatmap Placeholder
    return {
        "status": "success",
        "data": {
            "coordinates": [
                {"lat": 40.7128, "lng": -74.0060, "intensity": 0.8},
                {"lat": 40.7282, "lng": -73.7949, "intensity": 0.6}
            ]
        }
    }


@router.get("/expiry-alerts")
async def expiry_alerts(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    expiry_service = ExpiryService(db)
    return await expiry_service.check_for_expiry_alerts()
@router.get("/donor-ranking")
async def donor_ranking(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):

    ranking_service = DonorRankingService(db)

    result = await ranking_service.rank_donors()

    return {
        "status": "success",
        "data": result
    }
