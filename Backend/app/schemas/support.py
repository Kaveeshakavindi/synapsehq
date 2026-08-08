from pydantic import BaseModel, field_validator


class SupportTicketCreate(BaseModel):
    email: str
    subject: str
    message: str

    # Not pydantic's EmailStr — that needs the `email-validator` package,
    # which isn't in requirements.txt. Cheap sanity check instead of adding
    # a dependency for one field.
    @field_validator("email")
    @classmethod
    def looks_like_email(cls, v: str) -> str:
        v = v.strip()
        if "@" not in v or " " in v:
            raise ValueError("must be a valid email address")
        return v

    @field_validator("subject", "message")
    @classmethod
    def not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("must not be blank")
        return v


class SupportTicketOut(BaseModel):
    id: str
    email: str
    subject: str
    status: str = "received"
