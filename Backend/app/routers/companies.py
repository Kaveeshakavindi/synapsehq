from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.esg_topic import CompanyEsgTopic
from app.schemas.company import CompanyOptions

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("", response_model=list[CompanyOptions])
async def list_companies(db: AsyncSession = Depends(get_db)):
    """Every (company, ESG topic) pair available for analysis, grouped by
    company. Backs the Analyze page's company/topic dropdowns — no auth
    required, this is static reference data, not user data.
    """
    result = await db.execute(
        select(CompanyEsgTopic.company, CompanyEsgTopic.topic).order_by(
            CompanyEsgTopic.company, CompanyEsgTopic.topic
        )
    )

    grouped: dict[str, list[str]] = {}
    for company, topic in result.all():
        grouped.setdefault(company, []).append(topic)

    # ticker/industry: always null — see CompanyOptions' data-gap comment.
    return [CompanyOptions(name=name, topics=topics) for name, topics in grouped.items()]
