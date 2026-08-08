from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SubscriptionUsage(BaseModel):
    analyses_used: int
    analyses_limit: int
    queries_remaining: int
    reports_saved: int


class SubscriptionOut(BaseModel):
    """GET /subscription — plan, renewal, and usage for /dashboard/subscription."""

    plan: str
    status: str
    renewal_date: Optional[datetime] = None
    usage: SubscriptionUsage


class InvoiceOut(BaseModel):
    id: str
    date: datetime
    plan: str
    amount: float
    status: str
    download_url: str


class CheckoutRequest(BaseModel):
    """POST /checkout, POST /subscription/upgrade.

    Deliberately no card fields — billing is simulated (see decision notes
    in app/routers/subscription.py). If/when a real processor is wired up,
    this becomes a Stripe PaymentMethod/token id instead of ever touching
    raw card data server-side.
    """

    plan: str


class CheckoutResponse(BaseModel):
    plan: str
    status: str
    renewal_date: Optional[datetime] = None
