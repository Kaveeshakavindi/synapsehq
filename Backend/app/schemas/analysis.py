# app/schemas/analysis.py
from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    company: str
    topic: str


class AnalyzeResponse(BaseModel):
    company_claim_summary: str
    object_property: str
    judgment: str
    summary_counter_evidence: str
    greenwashing_status: str
    reason_for_judgement: str
    summary_support_evidence: str
    retrieved_documents: list[dict]