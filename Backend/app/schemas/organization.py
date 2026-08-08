from typing import Optional

from pydantic import BaseModel, field_validator


class OrganizationCreate(BaseModel):
    user_id: str
    name: str
    tin: str

    @field_validator("name", "tin")
    @classmethod
    def not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("must not be blank")
        return v


class OrganizationOut(BaseModel):
    id: str
    user_id: str
    name: str
    tin: str
    status: str


class OrganizationUpdate(BaseModel):
    """PATCH /organizations/{id} body. Plan isn't editable here — it's
    managed via /subscription."""

    name: Optional[str] = None

    @field_validator("name")
    @classmethod
    def not_blank(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("must not be blank")
        return v


class NotificationPreferences(BaseModel):
    """GET/PUT /organizations/{id}/notifications — the 4 toggle categories
    on the Settings page. Stored as jsonb on organizations.notification_preferences."""

    analysis_complete: bool = True
    weekly_digest: bool = True
    usage_alerts: bool = True
    team_updates: bool = True