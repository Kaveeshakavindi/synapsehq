from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class RecentAnalysis(BaseModel):
    id: str
    company: str
    topic: str
    judgment: Optional[str] = None
    confidence: Optional[float] = None
    created_at: datetime


class DashboardSummary(BaseModel):
    """GET /dashboard/summary — backs the /dashboard stat cards + recent
    analyses table."""

    analyses_count: int
    companies_analyzed_count: int
    saved_reports_count: int
    avg_confidence: Optional[float] = None
    recent_analyses: list[RecentAnalysis]
