from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Shared declarative base for SQLAlchemy ORM models (app/models/*.py that
    use Mapped/mapped_column, as opposed to the plain Pydantic models used for
    the Supabase-admin-client-backed `organizations` table)."""
