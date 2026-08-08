import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.db.supabase_admin import supabase_admin
from app.models.organization import Organization
from app.schemas.organization import (
    NotificationPreferences,
    OrganizationCreate,
    OrganizationOut,
    OrganizationUpdate,
)

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.post("", response_model=OrganizationOut, status_code=201)
async def create_organization(payload: OrganizationCreate):
    """
    Called right after supabase.auth.signUp() succeeds on the frontend.
    Uses the service_role client so the insert isn't blocked by RLS,
    since the user's session/JWT may not exist yet if email confirmation
    is required.

    NOTE: user_id here is trusted only because it comes straight from a
    signUp() response the frontend just received. If this endpoint is ever
    called from elsewhere, verify the user actually exists via
    supabase_admin.auth.admin.get_user_by_id(user_id) first.
    """
    existing = supabase_admin.table("organizations").select("id").eq("user_id", payload.user_id).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="Organization already submitted for this user")

    result = supabase_admin.table("organizations").insert({
        "user_id": payload.user_id,
        "name": payload.name,
        "tin": payload.tin,
        "status": "pending",
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create organization")

    return result.data[0]


@router.get("/me", response_model=OrganizationOut)
async def get_my_organization(user_id: str):
    """Used by the frontend to poll verification status after signup."""
    result = supabase_admin.table("organizations").select("*").eq("user_id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="No organization found")
    return result.data


async def _get_owned_org(db: AsyncSession, user: dict, org_id: str) -> Organization:
    """Fetch org_id, 404 if it doesn't exist (or was soft-deleted), 403 if it
    doesn't belong to the caller."""
    try:
        oid = uuid.UUID(org_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Organization not found")

    result = await db.execute(
        select(Organization).where(Organization.id == oid, Organization.deleted_at.is_(None))
    )
    org = result.scalar_one_or_none()
    if org is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    if str(org.user_id) != user.get("sub"):
        raise HTTPException(status_code=403, detail="Not your organization")
    return org


@router.patch("/{org_id}", response_model=OrganizationOut)
async def update_organization(
    org_id: str,
    payload: OrganizationUpdate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Settings page's editable org fields. Plan is managed via /subscription,
    not here."""
    org = await _get_owned_org(db, user, org_id)
    if payload.name is not None:
        org.name = payload.name
    await db.commit()
    await db.refresh(org)
    return OrganizationOut(
        id=str(org.id), user_id=str(org.user_id), name=org.name, tin=org.tin, status=org.status
    )


@router.get("/{org_id}/notifications", response_model=NotificationPreferences)
async def get_notifications(
    org_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org = await _get_owned_org(db, user, org_id)
    stored = org.notification_preferences or {}
    return NotificationPreferences(**{**NotificationPreferences().model_dump(), **stored})


@router.put("/{org_id}/notifications", response_model=NotificationPreferences)
async def update_notifications(
    org_id: str,
    payload: NotificationPreferences,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org = await _get_owned_org(db, user, org_id)
    org.notification_preferences = payload.model_dump()
    await db.commit()
    return payload


@router.delete("/{org_id}", status_code=204)
async def delete_organization(
    org_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft delete (sets deleted_at) rather than a hard delete: the Settings
    page's danger-zone button has no confirmation step yet, and losing
    analyses/bookmarks to one accidental click felt like the wrong default.
    Child rows (analyses, bookmarks, subscriptions) are left intact — a hard
    delete/cascade can be added once there's a confirm flow and a product
    decision on retention.
    """
    org = await _get_owned_org(db, user, org_id)
    org.deleted_at = datetime.now(timezone.utc)
    await db.commit()
