import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.analysis import AnalyzeRequest, AnalyzeResponse
from app.models.analysis_record import Analysis
from app.models.organization import Organization
from synapse_core.pipeline import evaluate_claim

router = APIRouter(prefix="/analyze", tags=["analyze"])

# Stopgap confidence used only when the LLM doesn't return its own
# `confidence` field (see the OUTPUT schema in synapse_core/prompt.py — it
# now asks for one, but Mistral isn't 100% reliable about including it).
# Coarse but keeps dashboard/history "average confidence" from having
# nothing to average when it's missing.
_FALLBACK_CONFIDENCE = {
    "Credible": 0.9,
    "Misleading": 0.5,
    "False": 0.1,
    "Unsupported": 0.3,
}


@router.post("", response_model=AnalyzeResponse)
async def analyze(
    payload: AnalyzeRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = evaluate_claim(payload.topic, payload.company)
        print(result)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

    # Runs for both a clean result and pipeline.py's JSON-parse-failure path
    # (that one still returns a normal AnalyzeResponse with error/raw_content
    # set, it just doesn't raise) — only a hard exception above skips
    # persistence, since there's no result to store at all in that case.
    await _persist_analysis(db, user, payload, result)

    return result


async def _persist_analysis(
    db: AsyncSession, user: dict, payload: AnalyzeRequest, result: AnalyzeResponse
) -> None:
    """Best-effort: a DB hiccup here must never break the /analyze response
    the frontend has already waited 30-60s for. Logs and swallows instead of
    raising.
    """
    try:
        user_id = user.get("sub")
        if not user_id:
            return

        org_result = await db.execute(
            select(Organization.id).where(
                Organization.user_id == uuid.UUID(user_id),
                Organization.deleted_at.is_(None),
            )
        )
        org_id = org_result.scalar_one_or_none()
        if org_id is None:
            # No org on this account yet (shouldn't happen once past
            # signup/verification, but don't block the analysis on it).
            return

        confidence = result.confidence
        if confidence is None and result.judgment:
            confidence = _FALLBACK_CONFIDENCE.get(result.judgment)

        db.add(
            Analysis(
                org_id=org_id,
                user_id=uuid.UUID(user_id),
                company=payload.company,
                topic=payload.topic,
                judgment=result.judgment,
                greenwashing_status=result.greenwashing_status,
                confidence=confidence,
                response=result.model_dump(mode="json"),
            )
        )
        await db.commit()
    except Exception as e:
        print(f"Failed to persist analysis: {e}")
        await db.rollback()
