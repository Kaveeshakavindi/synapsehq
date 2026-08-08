import html as html_lib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.deps import get_current_org
from app.models.analysis_record import Analysis
from app.models.bookmark import Bookmark
from app.models.organization import Organization
from app.schemas.analyses import (
    AnalysisDetail,
    AnalysisListItem,
    AnalysisListResponse,
    ShareResponse,
)

router = APIRouter(prefix="/analyses", tags=["analyses"])

SORTABLE_COLUMNS = {
    "created_at": Analysis.created_at,
    "company": Analysis.company,
    "confidence": Analysis.confidence,
}


def _apply_sort(query, sort: Optional[str]):
    if not sort:
        return query.order_by(Analysis.created_at.desc())
    desc = sort.startswith("-")
    key = sort[1:] if desc else sort
    column = SORTABLE_COLUMNS.get(key)
    if column is None:
        raise HTTPException(status_code=400, detail=f"Unsupported sort field: {key}")
    return query.order_by(column.desc() if desc else column.asc())


async def _get_owned_analysis(db: AsyncSession, org: Organization, analysis_id: str) -> Analysis:
    try:
        aid = uuid.UUID(analysis_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Analysis not found")
    result = await db.execute(select(Analysis).where(Analysis.id == aid, Analysis.org_id == org.id))
    analysis = result.scalar_one_or_none()
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis


async def _bookmarked_ids(db: AsyncSession, analysis_ids: list) -> set:
    if not analysis_ids:
        return set()
    result = await db.execute(select(Bookmark.analysis_id).where(Bookmark.analysis_id.in_(analysis_ids)))
    return {row[0] for row in result.all()}


@router.get("", response_model=AnalysisListResponse)
async def list_analyses(
    search: Optional[str] = None,
    company: Optional[str] = None,
    verdict: Optional[str] = None,
    sort: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Backs /dashboard/history: search + company/verdict filters + sort +
    pagination, all server-side."""
    query = select(Analysis).where(Analysis.org_id == org.id)
    count_query = select(func.count(Analysis.id)).where(Analysis.org_id == org.id)

    if search:
        like = f"%{search}%"
        cond = Analysis.company.ilike(like) | Analysis.topic.ilike(like)
        query = query.where(cond)
        count_query = count_query.where(cond)
    if company:
        query = query.where(Analysis.company == company)
        count_query = count_query.where(Analysis.company == company)
    if verdict:
        query = query.where(Analysis.judgment == verdict)
        count_query = count_query.where(Analysis.judgment == verdict)

    total = (await db.execute(count_query)).scalar_one()

    query = _apply_sort(query, sort).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(query)).scalars().all()

    bookmarked = await _bookmarked_ids(db, [r.id for r in rows])

    return AnalysisListResponse(
        items=[
            AnalysisListItem(
                id=str(r.id),
                company=r.company,
                topic=r.topic,
                judgment=r.judgment,
                confidence=r.confidence,
                created_at=r.created_at,
                bookmarked=r.id in bookmarked,
            )
            for r in rows
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


def _to_detail(a: Analysis, bookmarked: bool) -> AnalysisDetail:
    response = a.response or {}
    reason = response.get("reason_for_judgement") or []
    if isinstance(reason, str):
        reason = [reason]
    return AnalysisDetail(
        id=str(a.id),
        company=a.company,
        topic=a.topic,
        company_claim_summary=response.get("company_claim_summary"),
        object_property=response.get("object_property"),
        judgment=response.get("judgment"),
        summary_counter_evidence=response.get("summary_counter_evidence"),
        greenwashing_status=response.get("greenwashing_status"),
        reason_for_judgement=reason,
        summary_support_evidence=response.get("summary_support_evidence"),
        retrieved_documents=response.get("retrieved_documents") or {},
        error=response.get("error"),
        raw_content=response.get("raw_content"),
        confidence=a.confidence,
        created_at=a.created_at,
        bookmarked=bookmarked,
        key_findings=reason,  # stopgap — see AnalysisDetail's TODO
        recommendation=None,
    )


@router.get("/by-query", response_model=AnalysisDetail)
async def get_analysis_by_query(
    company: str,
    topic: str,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Lets /dashboard/results keep using its existing `?company=&topic=`
    routing instead of switching to `/analyses/{id}` links everywhere."""
    result = await db.execute(
        select(Analysis)
        .where(Analysis.org_id == org.id, Analysis.company == company, Analysis.topic == topic)
        .order_by(Analysis.created_at.desc())
        .limit(1)
    )
    analysis = result.scalar_one_or_none()
    if analysis is None:
        raise HTTPException(status_code=404, detail="No analysis found for this company/topic")
    bookmarked = bool(await _bookmarked_ids(db, [analysis.id]))
    return _to_detail(analysis, bookmarked)


@router.get("/{analysis_id}", response_model=AnalysisDetail)
async def get_analysis(
    analysis_id: str,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    analysis = await _get_owned_analysis(db, org, analysis_id)
    bookmarked = bool(await _bookmarked_ids(db, [analysis.id]))
    return _to_detail(analysis, bookmarked)


@router.delete("/{analysis_id}", status_code=204)
async def delete_analysis(
    analysis_id: str,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """History page's row delete action. Hard delete (unlike organizations)
    — analyses have no downstream data worth preserving once removed, and
    the row action already reads as destructive in the UI."""
    analysis = await _get_owned_analysis(db, org, analysis_id)
    await db.execute(delete(Bookmark).where(Bookmark.analysis_id == analysis.id))
    await db.delete(analysis)
    await db.commit()


@router.post("/{analysis_id}/bookmark", status_code=201)
async def bookmark_analysis(
    analysis_id: str,
    user: dict = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    analysis = await _get_owned_analysis(db, org, analysis_id)
    user_id = uuid.UUID(user["sub"])
    existing = await db.execute(
        select(Bookmark).where(Bookmark.analysis_id == analysis.id, Bookmark.user_id == user_id)
    )
    if existing.scalar_one_or_none() is None:
        db.add(Bookmark(analysis_id=analysis.id, user_id=user_id))
        await db.commit()
    return {"bookmarked": True}


@router.delete("/{analysis_id}/bookmark", status_code=204)
async def unbookmark_analysis(
    analysis_id: str,
    user: dict = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    analysis = await _get_owned_analysis(db, org, analysis_id)
    user_id = uuid.UUID(user["sub"])
    await db.execute(
        delete(Bookmark).where(Bookmark.analysis_id == analysis.id, Bookmark.user_id == user_id)
    )
    await db.commit()


def _esc(v) -> str:
    return html_lib.escape(str(v)) if v is not None else ""


def _render_report_html(analysis: Analysis, response: dict) -> str:
    reasons = response.get("reason_for_judgement") or []
    if isinstance(reasons, str):
        reasons = [reasons]
    reasons_html = "".join(f"<li>{_esc(r)}</li>" for r in reasons)

    return f"""<!doctype html>
<html><head><meta charset="utf-8"><title>{_esc(analysis.company)} — {_esc(analysis.topic)}</title>
<style>body{{font-family:sans-serif;max-width:720px;margin:40px auto;line-height:1.5}}
h1{{margin-bottom:0}} h2{{margin-top:32px}} .meta{{color:#666}}</style></head>
<body>
<h1>{_esc(analysis.company)}</h1>
<p class="meta">{_esc(analysis.topic)} &middot; {_esc(analysis.created_at)}</p>
<p><strong>Judgment:</strong> {_esc(response.get('judgment'))} &middot;
<strong>Status:</strong> {_esc(response.get('greenwashing_status'))} &middot;
<strong>Confidence:</strong> {_esc(analysis.confidence)}</p>
<h2>Claim Summary</h2><p>{_esc(response.get('company_claim_summary'))}</p>
<h2>Reasoning</h2><ul>{reasons_html}</ul>
<h2>Supporting Evidence</h2><p>{_esc(response.get('summary_support_evidence'))}</p>
<h2>Refuting Evidence</h2><p>{_esc(response.get('summary_counter_evidence'))}</p>
</body></html>"""


@router.get("/{analysis_id}/download")
async def download_analysis(
    analysis_id: str,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """v1: a self-contained HTML report, not a true PDF — no PDF library
    (reportlab/weasyprint/etc.) is installed in this project yet. See
    decision notes. Swap the media type/renderer here once one is added;
    the route contract (GET, downloadable attachment) doesn't need to
    change.
    """
    analysis = await _get_owned_analysis(db, org, analysis_id)
    response = analysis.response or {}
    html_doc = _render_report_html(analysis, response)
    filename = f"analysis-{analysis.company}-{analysis.topic}.html".replace(" ", "-")
    return Response(
        content=html_doc,
        media_type="text/html",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/{analysis_id}/share", response_model=ShareResponse)
async def share_analysis(
    analysis_id: str,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Issues a 7-day share token and stores it on the analysis row. No
    public unauthenticated viewer route exists yet (explicitly out of scope
    per the spec) — wiring a `/shared/{token}` page that reads by token
    instead of requiring auth is a follow-up.
    """
    analysis = await _get_owned_analysis(db, org, analysis_id)
    token = secrets.token_urlsafe(24)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    analysis.share_token = token
    analysis.share_token_expires_at = expires_at
    await db.commit()
    return ShareResponse(share_url=f"/shared/{token}", expires_at=expires_at)
