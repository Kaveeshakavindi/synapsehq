# db.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.environ["SUPABASE_DB_URL"].replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(
    DATABASE_URL,
    connect_args={"statement_cache_size": 0},  # required for PgBouncer transaction mode
)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)