import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import Float, ForeignKey, String, DateTime, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Analysis(Base):
    """One persisted POST /analyze run. Written by app/routers/analyze.py on
    every call that produces a result (success or LLM-JSON-parse failure —
    both return a normal AnalyzeResponse; see that router for what's
    skipped). Backs /dashboard/summary, /analyses, /analyses/{id},
    /reports, and the results page.
    """

    __tablename__ = "analyses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    company: Mapped[str] = mapped_column(String, nullable=False, index=True)
    topic: Mapped[str] = mapped_column(String, nullable=False)
    judgment: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    greenwashing_status: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    # LLM-reported confidence when the prompt supplies one (see
    # synapse_core/prompt.py), else the server-side fallback mapped from
    # `judgment` in app/routers/analyze.py — always populated so
    # dashboard/history aggregates never average over nothing.
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    response: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    # Share-link support (not in the original table spec — added here rather
    # than a separate table since it's strictly 1:1 with an analysis).
    share_token: Mapped[Optional[str]] = mapped_column(String, nullable=True, unique=True, index=True)
    share_token_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()"), index=True
    )
