"""
app/core/database.py

Async SQLAlchemy engine + session factory.
The get_session dependency commits on success and rolls back on any exception —
routers never need to call session.commit() themselves.
"""
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from backend.core.constants import Base

# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------
from backend.core.config import get_settings

settings = get_settings()


engine = create_async_engine(
    settings.database_url,
    echo=False,          # set True locally for SQL logging; never in prod
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # drops stale connections before use
)

AsyncSessionFactory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # safe to read attributes after commit
)


# ---------------------------------------------------------------------------
# FastAPI dependency — one session per request
# ---------------------------------------------------------------------------
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# ---------------------------------------------------------------------------
# Startup helper (called from app lifespan)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app):
    # Optionally run migrations here via Alembic programmatically,
    # or just verify connectivity.
    async with engine.begin() as conn:
        # Sanity-check connection on startup; do NOT use create_all in prod —
        # use Alembic migrations instead.
        await conn.run_sync(lambda _: None)
    yield
    await engine.dispose()