from typing import Optional

from pydantic import BaseModel


class CompanyOptions(BaseModel):
    """A company and the ESG topics it can be analyzed on — one entry of the
    GET /companies response the frontend uses to populate the Analyze page's
    company/topic dropdowns, and (via ticker/industry) the Companies
    directory's search and cards."""

    name: str
    topics: list[str]
    # Data gap: esg_final_enriched.csv (the source for company_esg_topics)
    # has no ticker/industry columns, so these are always null today rather
    # than inventing values. Populate once a source with that data is added
    # to DataPreprocessing/ and threaded through load_esg_topics.py.
    ticker: Optional[str] = None
    industry: Optional[str] = None
