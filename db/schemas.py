"""
Pydantic schemas for API request/response serialization.

These schemas define the data shapes used in FastAPI route handlers.
Frontend developers can reference this file to understand the exact
structure of API payloads.
"""

from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, Field


# ===================================================================
# Response Schemas (API → Frontend)
# ===================================================================

class PatternOut(BaseModel):
    """A single detected pattern label."""
    pattern_name: str = Field(..., examples=["cycle_length_3", "fan_in", "high_velocity"])

    model_config = {"from_attributes": True}


class SuspiciousAccountOut(BaseModel):
    """A flagged account within a session."""
    account_id: str = Field(..., examples=["ACC_00123"])
    suspicion_score: float = Field(..., ge=0, le=100, examples=[87.5])
    ring_id: str = Field(..., examples=["RING_001"])
    detected_patterns: list[PatternOut] = []

    model_config = {"from_attributes": True}


class RingMemberOut(BaseModel):
    """A member within a fraud ring."""
    account_id: str = Field(..., examples=["ACC_00123"])

    model_config = {"from_attributes": True}


class FraudRingOut(BaseModel):
    """A detected fraud ring."""
    ring_id: str = Field(..., examples=["RING_001"])
    pattern_type: str = Field(..., examples=["cycle", "smurfing", "layered_shell"])
    risk_score: float = Field(..., ge=0, le=100, examples=[95.3])
    member_count: int = Field(..., ge=0, examples=[4])
    members: list[RingMemberOut] = []

    model_config = {"from_attributes": True}


class SessionSummaryOut(BaseModel):
    """Lightweight session metadata for list views."""
    id: str
    filename: str
    total_accounts: int
    suspicious_count: int
    rings_detected: int
    processing_time: float
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionDetailOut(SessionSummaryOut):
    """Full session data including nested accounts and rings."""
    suspicious_accounts: list[SuspiciousAccountOut] = []
    fraud_rings: list[FraudRingOut] = []


# ===================================================================
# Request Schemas (Frontend → API)
# ===================================================================

class SuspiciousAccountIn(BaseModel):
    """Suspicious account data from the analysis engine."""
    account_id: str
    suspicion_score: float = Field(..., ge=0, le=100)
    detected_patterns: list[str] = Field(
        ...,
        examples=[["cycle_length_3", "high_velocity"]],
    )
    ring_id: str


class FraudRingIn(BaseModel):
    """Fraud ring data from the analysis engine."""
    ring_id: str
    member_accounts: list[str] = Field(
        ...,
        examples=[["ACC_00123", "ACC_00456", "ACC_00789"]],
    )
    pattern_type: str
    risk_score: float = Field(..., ge=0, le=100)


class SummaryIn(BaseModel):
    """Summary statistics from the analysis engine."""
    total_accounts_analyzed: int
    suspicious_accounts_flagged: int
    fraud_rings_detected: int
    processing_time_seconds: float


class AnalysisResultIn(BaseModel):
    """
    Complete analysis result payload sent from the frontend
    after processing is complete.

    This matches the JSON output spec from the PRD:
    {
      "suspicious_accounts": [...],
      "fraud_rings": [...],
      "summary": {...}
    }
    """
    filename: str = Field(..., examples=["transactions_batch_01.csv"])
    suspicious_accounts: list[SuspiciousAccountIn]
    fraud_rings: list[FraudRingIn]
    summary: SummaryIn
