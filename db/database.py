"""
Database engine, session factory, and initialization.

Usage:
    from db.database import get_db, init_db

    # On app startup
    init_db()

    # In FastAPI dependency injection
    @app.get("/example")
    def example(db: Session = Depends(get_db)):
        ...
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from .models import Base

# ------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------
# Default: SQLite file in the project root
# Override via DATABASE_URL env var for Postgres, e.g.:
#   DATABASE_URL=postgresql://user:pass@localhost:5432/muling_db
# ------------------------------------------------------------------
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./muling_detection.db")

# SQLite requires check_same_thread=False for FastAPI's async usage
_connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    _connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=_connect_args,
    echo=False,  # Set True to log all SQL statements (debugging)
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """Create all tables defined in models.py.
    Safe to call multiple times — existing tables are not recreated.
    """
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency — yields a DB session and closes it after the request."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
