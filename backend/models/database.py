"""Database utilities for test compatibility."""
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Shared in-memory SQLite database across threads for test client usage
engine = create_engine(
    "sqlite://",
    echo=False,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Yield a database session tied to the shared in-memory engine."""

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
