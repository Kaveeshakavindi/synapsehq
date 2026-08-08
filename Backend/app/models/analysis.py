from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Union, Any


class Citation(BaseModel):
    """One retrieved/cited document. Adjust fields to match citations() output."""
    source: Optional[str] = None
    content: Optional[str] = None
    score: Optional[float] = None
    metadata: Optional[dict[str, Any]] = None


class RetrievedDocuments(BaseModel):
    company_reports: list[Citation] = Field(default_factory=list)
    counterfactual_sources: list[Citation] = Field(default_factory=list)
    supportive_sources: list[Citation] = Field(default_factory=list)


class AnalyzeRequest(BaseModel):
    company: str
    topic: str


class AnalyzeResponse(BaseModel):
    company_claim_summary: Optional[str] = None
    object_property: Optional[str] = None          # was float — LLM returns a string like "contradictedBy"
    judgment: Optional[str] = None
    summary_counter_evidence: Optional[str] = None
    greenwashing_status: Optional[str] = None
    reason_for_judgement: Optional[Union[str, List[str]]] = None  # LLM sometimes returns list, prompt says string
    summary_support_evidence: Optional[str] = None
    retrieved_documents: Optional[RetrievedDocuments] = None
    error: Optional[str] = None
    raw_content: Optional[str] = None
    # 0.0-1.0, asked for in synapse_core/prompt.py's OUTPUT schema. None when
    # the LLM omits it — app/routers/analyze.py falls back to a coarse
    # judgment->confidence mapping before persisting, so this field itself
    # stays a faithful "what the model actually said" rather than always
    # being populated.
    confidence: Optional[float] = None

    # The prompt asks for these as single strings, but the LLM isn't fully
    # consistent — it sometimes returns a list of quotes/steps instead (e.g.
    # ["1. Quote from [EXTERNAL...", "2. ..."]), which used to blow up
    # validation with "Input should be a valid string [type=string_type]".
    # Join lists into one string so the field always matches the documented
    # `string | null` contract the frontend renders as a single paragraph.
    @field_validator(
        "company_claim_summary",
        "summary_counter_evidence",
        "summary_support_evidence",
        mode="before",
    )
    @classmethod
    def _join_if_list(cls, value: Any) -> Any:
        if isinstance(value, list):
            return "\n".join(str(item) for item in value)
        return value

    # Mistral sometimes returns "0.8" as a quoted string instead of a bare
    # number. Coerce rather than reject; if it's not parseable, drop to None
    # so the analyze router's fallback mapping kicks in instead of 500ing.
    @field_validator("confidence", mode="before")
    @classmethod
    def _coerce_confidence(cls, value: Any) -> Any:
        if isinstance(value, str):
            try:
                return float(value)
            except ValueError:
                return None
        return value