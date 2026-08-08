import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.deps import get_current_org
from app.models.analysis_record import Analysis
from app.models.bookmark import Bookmark
from app.models.organization import Organization
from app.models.subscription import Invoice, Subscription
from app.schemas.subscription import (
    CheckoutRequest,
    CheckoutResponse,
    InvoiceOut,
    SubscriptionOut,
    SubscriptionUsage,
)

# No shared URL prefix — routes span /subscription/* and /checkout.
router = APIRouter(tags=["subscription"])

# DECISION: simulated billing, no real payment processor integrated (no
# Stripe keys in Backend/.env, and wiring real Stripe — Elements, webhooks,
# a customer/subscription id mirror — is a bigger scope than this pass).
# This table is the actual source of truth for plan/limits, not a mirror of
# an external object. Swap in real Stripe by keeping this same
# Subscription/Invoice shape and having checkout() call Stripe first.
PLAN_LIMITS = {
    "free": {"queries_limit": 10, "price": 0},
    "professional": {"queries_limit": 50, "price": 49},
    "enterprise": {"queries_limit": 500, "price": 199},
}


async def _get_or_create_subscription(db: AsyncSession, org: Organization) -> Subscription:
    result = await db.execute(select(Subscription).where(Subscription.org_id == org.id))
    sub = result.scalar_one_or_none()
    if sub is None:
        sub = Subscription(
            org_id=org.id, plan="free", status="active", queries_limit=PLAN_LIMITS["free"]["queries_limit"]
        )
        db.add(sub)
        await db.commit()
        await db.refresh(sub)
    return sub


@router.get("/subscription", response_model=SubscriptionOut)
async def get_subscription(
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    sub = await _get_or_create_subscription(db, org)

    analyses_count = (
        await db.execute(select(func.count(Analysis.id)).where(Analysis.org_id == org.id))
    ).scalar_one()
    saved_count = (
        await db.execute(
            select(func.count(Bookmark.id))
            .join(Analysis, Analysis.id == Bookmark.analysis_id)
            .where(Analysis.org_id == org.id)
        )
    ).scalar_one()

    return SubscriptionOut(
        plan=sub.plan,
        status=sub.status,
        renewal_date=sub.renewed_at,
        usage=SubscriptionUsage(
            analyses_used=analyses_count,
            analyses_limit=sub.queries_limit,
            queries_remaining=max(sub.queries_limit - sub.queries_used, 0),
            reports_saved=saved_count,
        ),
    )


@router.get("/subscription/invoices", response_model=list[InvoiceOut])
async def list_invoices(
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Invoice).where(Invoice.org_id == org.id).order_by(Invoice.created_at.desc())
    )
    return [
        InvoiceOut(
            id=str(i.id),
            date=i.created_at,
            plan=i.plan,
            amount=float(i.amount),
            status=i.status,
            download_url=f"/subscription/invoices/{i.id}/download",
        )
        for i in result.scalars().all()
    ]


@router.get("/subscription/invoices/{invoice_id}/download")
async def download_invoice(
    invoice_id: str,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Same v1-HTML-not-PDF caveat as GET /analyses/{id}/download."""
    try:
        iid = uuid.UUID(invoice_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Invoice not found")
    result = await db.execute(select(Invoice).where(Invoice.id == iid, Invoice.org_id == org.id))
    invoice = result.scalar_one_or_none()
    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")

    html_doc = (
        "<!doctype html><html><body>"
        f"<h1>Invoice {invoice.id}</h1>"
        f"<p>Plan: {invoice.plan}</p><p>Amount: ${invoice.amount}</p>"
        f"<p>Status: {invoice.status}</p><p>Date: {invoice.created_at}</p>"
        "</body></html>"
    )
    return Response(
        content=html_doc,
        media_type="text/html",
        headers={"Content-Disposition": f'attachment; filename="invoice-{invoice.id}.html"'},
    )


async def _apply_plan(db: AsyncSession, org: Organization, plan: str) -> Subscription:
    plan_config = PLAN_LIMITS.get(plan)
    if plan_config is None:
        raise HTTPException(status_code=400, detail=f"Unknown plan: {plan}")

    sub = await _get_or_create_subscription(db, org)
    sub.plan = plan
    sub.status = "active"
    sub.queries_limit = plan_config["queries_limit"]
    sub.queries_used = 0
    sub.renewed_at = datetime.now(timezone.utc) + timedelta(days=30)

    db.add(
        Invoice(org_id=org.id, subscription_id=sub.id, plan=plan, amount=plan_config["price"], status="paid")
    )
    await db.commit()
    await db.refresh(sub)
    return sub


@router.post("/checkout", response_model=CheckoutResponse, status_code=201)
async def checkout(
    payload: CheckoutRequest,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """No raw card data is accepted here by design (see PLAN_LIMITS'
    decision note) — this only records the plan change + a simulated paid
    invoice."""
    sub = await _apply_plan(db, org, payload.plan)
    return CheckoutResponse(plan=sub.plan, status=sub.status, renewal_date=sub.renewed_at)


@router.post("/subscription/upgrade", response_model=CheckoutResponse)
async def upgrade_subscription(
    payload: CheckoutRequest,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    sub = await _apply_plan(db, org, payload.plan)
    return CheckoutResponse(plan=sub.plan, status=sub.status, renewal_date=sub.renewed_at)


@router.post("/subscription/cancel", response_model=CheckoutResponse)
async def cancel_subscription(
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    sub = await _get_or_create_subscription(db, org)
    sub.status = "cancelled"
    await db.commit()
    await db.refresh(sub)
    return CheckoutResponse(plan=sub.plan, status=sub.status, renewal_date=sub.renewed_at)
