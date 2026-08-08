import uuid
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user_optional
from app.db.session import get_db
from app.models.organization import Organization
from app.models.support_ticket import SupportTicket
from app.schemas.support import SupportTicketCreate, SupportTicketOut

router = APIRouter(prefix="/support", tags=["support"])


@router.post("/tickets", response_model=SupportTicketOut, status_code=201)
async def create_ticket(
    payload: SupportTicketCreate,
    user: Optional[dict] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """DECISION: no email-sending infra exists in this project yet (no SMTP/
    provider config in Backend/.env), so this is DB-only for now — tickets
    have to be checked manually in support_tickets until an email or
    notification integration is added. Auth is optional: an anonymous
    visitor can submit from the marketing site, but a logged-in user's
    identity/org gets attached when available.
    """
    org_id = None
    user_id = None
    if user:
        user_id = user.get("sub")
        if user_id:
            org_result = await db.execute(
                select(Organization.id).where(
                    Organization.user_id == uuid.UUID(user_id),
                    Organization.deleted_at.is_(None),
                )
            )
            org_id = org_result.scalar_one_or_none()

    ticket = SupportTicket(
        org_id=org_id,
        user_id=uuid.UUID(user_id) if user_id else None,
        email=payload.email,
        subject=payload.subject,
        message=payload.message,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return SupportTicketOut(id=str(ticket.id), email=ticket.email, subject=ticket.subject)
