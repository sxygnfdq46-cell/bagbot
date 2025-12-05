"""Async SQLAlchemy session handling for the backend (minimal stub)."""
from __future__ import annotations

import os
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

_DEFAULT_URL = "sqlite+aiosqlite:///:memory:"

DATABASE_URL: str = os.getenv("DATABASE_URL") or _DEFAULT_URL
engine = create_async_engine(DATABASE_URL, echo=False, future=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


def configure_engine(url: str | None = None) -> None:
    """Reconfigure the global async engine/session factory (used in tests)."""

    global DATABASE_URL, engine, AsyncSessionLocal  # noqa: PLW0603 - intentional reassignment
    DATABASE_URL = url or os.getenv("DATABASE_URL") or _DEFAULT_URL
    engine = create_async_engine(DATABASE_URL, echo=False, future=True)
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


aSYNC_GEN = AsyncGenerator  # type alias to keep lint quiet if needed

async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an async DB session."""

    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


__all__ = [
    "DATABASE_URL",
    "engine",
    "AsyncSessionLocal",
    "get_async_session",
    "configure_engine",
]
