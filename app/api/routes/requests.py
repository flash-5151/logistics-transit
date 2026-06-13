from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user, RoleChecker
from app.db.session import get_db
from app.models.enums import UserRole
from app.repositories.request import RequestRepository
from app.schemas.request import BloodRequest, BloodRequestCreate, BloodRequestUpdate
from app.services.matching import MatchingService

router = APIRouter()
allow_hospital_admin = RoleChecker([UserRole.HOSPITAL, UserRole.ADMIN])


@router.post("/", response_model=BloodRequest)
async def create_request(
    obj_in: BloodRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(allow_hospital_admin)
):
    repo = RequestRepository(db)
    return await repo.create(obj_in=obj_in.dict())


@router.get("/", response_model=List[BloodRequest])
async def read_requests(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    repo = RequestRepository(db)
    return await repo.get_multi(skip=skip, limit=limit)


@router.get("/{id}", response_model=BloodRequest)
async def read_request(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    repo = RequestRepository(db)
    request = await repo.get(id)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    return request


@router.post("/{id}/match")
async def match_request(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(allow_hospital_admin)
):
    matching_service = MatchingService(db)
    matches = await matching_service.find_matches(id)
    return {"request_id": id, "matches": matches}


@router.delete("/{id}", response_model=BloodRequest)
async def delete_request(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(allow_hospital_admin)
):
    repo = RequestRepository(db)
    db_obj = await repo.get(id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Request not found")
    if current_user.role == UserRole.HOSPITAL and db_obj.hospital_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this request")
    return await repo.remove(id=id)


@router.patch("/{id}", response_model=BloodRequest)
async def update_request(
    id: UUID,
    obj_in: BloodRequestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    repo = RequestRepository(db)
    db_obj = await repo.get(id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Request not found")
    return await repo.update(db_obj=db_obj, obj_in=obj_in.dict(exclude_unset=True))


