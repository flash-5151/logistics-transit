from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user, RoleChecker
from app.db.session import get_db
from app.models.enums import UserRole
from app.repositories.user import UserRepository
from app.schemas.user import User

router = APIRouter()
allow_blood_bank_admin = RoleChecker([UserRole.BLOOD_BANK, UserRole.ADMIN])


@router.get("/", response_model=List[User])
async def read_donors(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(allow_blood_bank_admin)
):
    repo = UserRepository(db)
    # Filter by role in a real implementation
    users = await repo.get_multi(skip=skip, limit=limit)
    return [u for u in users if u.role == UserRole.DONOR]


allow_admin = RoleChecker([UserRole.ADMIN])


@router.get("/all-users", response_model=List[User])
async def read_all_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    repo = UserRepository(db)
    return await repo.get_multi(skip=skip, limit=limit)


@router.put("/{id}/toggle-active", response_model=User)
async def toggle_user_active(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(allow_admin)
):
    repo = UserRepository(db)
    db_obj = await repo.get(id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="User not found")
    updated_obj = await repo.update(db_obj=db_obj, obj_in={"is_active": not db_obj.is_active})
    return updated_obj


@router.delete("/{id}", response_model=User)
async def delete_user(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(allow_admin)
):
    repo = UserRepository(db)
    db_obj = await repo.get(id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="User not found")
    return await repo.remove(id=id)


@router.get("/{id}", response_model=User)
async def read_donor(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    repo = UserRepository(db)
    user = await repo.get(id)
    if not user or user.role != UserRole.DONOR:
        raise HTTPException(status_code=404, detail="Donor not found")
    return user

