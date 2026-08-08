from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class AnalysisListItem(BaseModel):
    """One row of GET /analyses or GET /reports."""

    id: str
    company: str
    topic: str
    judgment: Optional[str] = None
    confidence: Optional[float] = None
    created_at: datetime
    bookmarked: bool


class AnalysisListResponse(BaseModel):
    items: list[AnalysisListItem]
    total: int
    page: int
    page_size: int


class AnalysisDetail(BaseModel):
    """GET /analyses/{id} and GET /analyses/by-query — the stored
    AnalyzeResponse plus results-page-only fields (id, confidence,
    created_at, bookmarked, key_findings, recommendation)."""

    id: str
    company: str
    topic: str
    company_claim_summary: Optional[str] = None
    object_property: Optional[str] = None
    judgment: Optional[str] = None
    summary_counter_evidence: Optional[str] = None
    greenwashing_status: Optional[str] = None
    reason_for_judgement: list[str] = []
    summary_support_evidence: Optional[str] = None
    retrieved_documents: dict[str, Any] = {}
    error: Optional[str] = None
    raw_content: Optional[str] = None
    confidence: Optional[float] = None
    created_at: datetime
    bookmarked: bool
    # TODO: `key_findings` and `recommendation` aren't part of the LLM's
    # output schema yet (synapse_core/prompt.py only asks for
    # reason_for_judgement / summary_*). key_findings is derived from
    # reason_for_judgement as a stopgap; recommendation is left null.
    # Extending the prompt schema for these was out of scope for this pass.
    key_findings: list[str] = []
    recommendation: Optional[str] = None


class ShareResponse(BaseModel):
    share_url: str
    expires_at: datetime
