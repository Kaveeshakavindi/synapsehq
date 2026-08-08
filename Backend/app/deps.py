"""Shared FastAPI dependencies used by more than one router."""

import uuid

from fastapi import Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.organization import Organization


async def get_current_org(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Organization:
    """Resolve the caller's organization from their JWT `sub` claim. Used by
    every endpoint scoped to "the caller's org" (dashboard, analyses,
    reports, subscription). 404s if the account has no org yet or it was
    soft-deleted — callers that need to distinguish "pending verification"
    from "no org" should check `org.status` themselves.
    """
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing subject claim")

    result = await db.execute(
        select(Organization).where(
            Organization.user_id == uuid.UUID(user_id),
            Organization.deleted_at.is_(None),
        )
    )
    org = result.scalar_one_or_none()
    if org is None:
        raise HTTPException(status_code=404, detail="No organization found for this account")
    return org
