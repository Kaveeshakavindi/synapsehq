from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.deps import get_current_org
from app.models.analysis_record import Analysis
from app.models.bookmark import Bookmark
from app.models.organization import Organization
from app.schemas.dashboard import DashboardSummary, RecentAnalysis

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def get_summary(
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Backs the /dashboard stat cards + recent analyses table."""
    counts = await db.execute(
        select(
            func.count(Analysis.id),
            func.count(func.distinct(Analysis.company)),
            func.avg(Analysis.confidence),
        ).where(Analysis.org_id == org.id)
    )
    analyses_count, companies_count, avg_confidence = counts.one()

    saved_result = await db.execute(
        select(func.count(Bookmark.id))
        .join(Analysis, Analysis.id == Bookmark.analysis_id)
        .where(Analysis.org_id == org.id)
    )
    saved_reports_count = saved_result.scalar_one()

    recent_result = await db.execute(
        select(Analysis)
        .where(Analysis.org_id == org.id)
        .order_by(Analysis.created_at.desc())
        .limit(5)
    )
    recent = recent_result.scalars().all()

    return DashboardSummary(
        analyses_count=analyses_count or 0,
        companies_analyzed_count=companies_count or 0,
        saved_reports_count=saved_reports_count or 0,
        avg_confidence=float(avg_confidence) if avg_confidence is not None else None,
        recent_analyses=[
            RecentAnalysis(
                id=str(a.id),
                company=a.company,
                topic=a.topic,
                judgment=a.judgment,
                confidence=a.confidence,
                created_at=a.created_at,
            )
            for a in recent
        ],
    )
