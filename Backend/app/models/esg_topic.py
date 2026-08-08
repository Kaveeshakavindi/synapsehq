from typing import Optional

from sqlalchemy import String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CompanyEsgTopic(Base):
    """One (company, ESG topic) pair that can be analyzed.

    Loaded from
    DataPreprocessing/Dataset/processed/semantic_extraction/esg_final_enriched.csv
    via DataPreprocessing/load_esg_topics.py — `company` matches the `company`
    column there (same casing synapse_core/retrieval.py lowercases and filters
    on), `topic` matches its `category` column. Powers GET /companies, which
    the frontend's Analyze page uses to populate the company/topic dropdowns
    instead of a hardcoded list.
    """

    __tablename__ = "company_esg_topics"
    __table_args__ = (UniqueConstraint("company", "topic", name="uq_company_topic"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    company: Mapped[str] = mapped_column(String, nullable=False, index=True)
    topic: Mapped[str] = mapped_column(String, nullable=False)
    pillar: Mapped[Optional[str]] = mapped_column(String, nullable=True)
