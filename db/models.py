"""
SQLAlchemy ORM Models for Money Muling Detection Engine.

Tables:
  - analysis_sessions  : Top-level analysis run metadata
  - suspicious_accounts: Flagged accounts with suspicion scores
  - detected_patterns  : Pattern labels linked to suspicious accounts
  - fraud_rings        : Detected fraud ring groupings
  - ring_members       : Member accounts within each fraud ring
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Text,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship, DeclarativeBase


def _generate_uuid() -> str:
    return str(uuid.uuid4())


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


# ---------------------------------------------------------------------------
# Analysis Session
# ---------------------------------------------------------------------------
class AnalysisSession(Base):
    __tablename__ = "analysis_sessions"

    id = Column(String, primary_key=True, default=_generate_uuid)
    filename = Column(String, nullable=False, doc="Original CSV filename")
    total_accounts = Column(Integer, nullable=False, doc="Total unique accounts analyzed")
    suspicious_count = Column(Integer, nullable=False, doc="Number of flagged accounts")
    rings_detected = Column(Integer, nullable=False, doc="Number of fraud rings found")
    processing_time = Column(Float, nullable=False, doc="Processing duration in seconds")
    raw_summary = Column(Text, nullable=False, doc="Full analysis summary as JSON string")
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        doc="Timestamp of analysis run",
    )

    # Relationships
    suspicious_accounts = relationship(
        "SuspiciousAccount",
        back_populates="session",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    fraud_rings = relationship(
        "FraudRing",
        back_populates="session",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<AnalysisSession {self.id} file={self.filename}>"


# ---------------------------------------------------------------------------
# Suspicious Account
# ---------------------------------------------------------------------------
class SuspiciousAccount(Base):
    __tablename__ = "suspicious_accounts"

    id = Column(String, primary_key=True, default=_generate_uuid)
    session_id = Column(
        String,
        ForeignKey("analysis_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    account_id = Column(String, nullable=False, doc="e.g. ACC_00123")
    suspicion_score = Column(Float, nullable=False, doc="Score 0-100")
    ring_id = Column(String, nullable=False, doc="e.g. RING_001")

    # Relationships
    session = relationship("AnalysisSession", back_populates="suspicious_accounts")
    detected_patterns = relationship(
        "DetectedPattern",
        back_populates="suspicious_account",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<SuspiciousAccount {self.account_id} score={self.suspicion_score}>"


# ---------------------------------------------------------------------------
# Detected Pattern
# ---------------------------------------------------------------------------
class DetectedPattern(Base):
    __tablename__ = "detected_patterns"

    id = Column(String, primary_key=True, default=_generate_uuid)
    suspicious_account_id = Column(
        String,
        ForeignKey("suspicious_accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    pattern_name = Column(
        String,
        nullable=False,
        doc="e.g. cycle_length_3, high_velocity, fan_in, fan_out, layered_shell",
    )

    # Relationships
    suspicious_account = relationship("SuspiciousAccount", back_populates="detected_patterns")

    def __repr__(self) -> str:
        return f"<DetectedPattern {self.pattern_name}>"


# ---------------------------------------------------------------------------
# Fraud Ring
# ---------------------------------------------------------------------------
class FraudRing(Base):
    __tablename__ = "fraud_rings"

    id = Column(String, primary_key=True, default=_generate_uuid)
    session_id = Column(
        String,
        ForeignKey("analysis_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    ring_id = Column(String, nullable=False, doc="e.g. RING_001")
    pattern_type = Column(
        String,
        nullable=False,
        doc="cycle | smurfing | layered_shell",
    )
    risk_score = Column(Float, nullable=False, doc="Ring risk score 0-100")
    member_count = Column(Integer, nullable=False, doc="Number of member accounts")

    # Relationships
    session = relationship("AnalysisSession", back_populates="fraud_rings")
    members = relationship(
        "RingMember",
        back_populates="ring",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<FraudRing {self.ring_id} type={self.pattern_type}>"


# ---------------------------------------------------------------------------
# Ring Member
# ---------------------------------------------------------------------------
class RingMember(Base):
    __tablename__ = "ring_members"

    id = Column(String, primary_key=True, default=_generate_uuid)
    fraud_ring_id = Column(
        String,
        ForeignKey("fraud_rings.id", ondelete="CASCADE"),
        nullable=False,
    )
    account_id = Column(String, nullable=False, doc="Member account ID")

    # Relationships
    ring = relationship("FraudRing", back_populates="members")

    def __repr__(self) -> str:
        return f"<RingMember {self.account_id}>"
