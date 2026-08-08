from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.deps import get_current_org
from app.models.analysis_record import Analysis
from app.models.bookmark import Bookmark
from app.models.organization import Organization
from app.schemas.analyses import AnalysisListItem, AnalysisListResponse

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("", response_model=AnalysisListResponse)
async def list_reports(
    search: Optional[str] = None,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Backs /dashboard/reports — bookmarked analyses only, newest bookmark
    first."""
    query = (
        select(Analysis)
        .join(Bookmark, Bookmark.analysis_id == Analysis.id)
        .where(Analysis.org_id == org.id)
        .order_by(Bookmark.created_at.desc())
    )
    if search:
        like = f"%{search}%"
        query = query.where(Analysis.company.ilike(like) | Analysis.topic.ilike(like))

    rows = (await db.execute(query)).scalars().all()
    return AnalysisListResponse(
        items=[
            AnalysisListItem(
                id=str(r.id),
                company=r.company,
                topic=r.topic,
                judgment=r.judgment,
                confidence=r.confidence,
                created_at=r.created_at,
                bookmarked=True,
            )
            for r in rows
        ],
        total=len(rows),
        page=1,
        page_size=len(rows) or 1,
    )
