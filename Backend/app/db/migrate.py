"""One-off / re-runnable schema setup for the dashboard feature set
(analyses, bookmarks, subscriptions, invoices, support_tickets) plus two
columns added to the pre-existing `organizations` table
(notification_preferences, deleted_at).

No migration framework (Alembic etc.) is set up in this project — this
follows the same pattern as DataPreprocessing/load_esg_topics.py: a plain
async script you run by hand after pulling schema changes. Safe to re-run:
`ADD COLUMN IF NOT EXISTS` and `CREATE TABLE IF NOT EXISTS` (via
`Base.metadata.create_all`) are both no-ops on a schema that's already
up to date.

    source venv/bin/activate
    python -m app.db.migrate
"""

import asyncio

from sqlalchemy import text

from app.db.base import Base
from app.db.session import engine

# Import every ORM model so Base.metadata knows about their tables before
# create_all runs. company_esg_topics/organizations already exist in the DB
# (created outside SQLAlchemy) — create_all leaves existing tables alone, it
# only creates ones that are missing.
from app.models import (  # noqa: F401
    analysis_record,
    bookmark,
    esg_topic,
    organization,
    subscription,
    support_ticket,
)

ALTER_STATEMENTS = [
    "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{}'::jsonb",
    "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS deleted_at timestamptz",
]


async def main() -> None:
    async with engine.begin() as conn:
        for stmt in ALTER_STATEMENTS:
            await conn.execute(text(stmt))
        await conn.run_sync(Base.metadata.create_all)
    print("Migration complete: analyses, bookmarks, subscriptions, invoices, "
          "support_tickets tables ensured; organizations.notification_preferences "
          "and organizations.deleted_at ensured.")


if __name__ == "__main__":
    asyncio.run(main())
