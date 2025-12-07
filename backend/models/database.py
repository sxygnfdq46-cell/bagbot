"""Database utilities for test compatibility."""
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

# Placeholder database setup
engine = create_engine("sqlite:///:memory:", echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency to get database session.
    This is a placeholder for test compatibility.
    
    Yields:
        Database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
