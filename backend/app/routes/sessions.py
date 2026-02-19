"""
FastAPI CRUD routes for analysis sessions.

Endpoints:
    POST   /api/sessions       — Save a new analysis result
    GET    /api/sessions       — List all past sessions (summaries)
    GET    /api/sessions/{id}  — Get full session detail
    DELETE /api/sessions/{id}  — Delete a session (cascading)
"""

import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import (
    AnalysisSession,
    SuspiciousAccount,
    DetectedPattern,
    FraudRing,
    RingMember,
)
from db.schemas import (
    AnalysisResultIn,
    SessionSummaryOut,
    SessionDetailOut,
)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


# ---------------------------------------------------------------
# POST /api/sessions — Save analysis results
# ---------------------------------------------------------------
@router.post(
    "",
    response_model=SessionDetailOut,
    status_code=status.HTTP_201_CREATED,
    summary="Save analysis results",
)
def create_session(payload: AnalysisResultIn, db: Session = Depends(get_db)):
    """
    Receives the full analysis result from the frontend and persists
    it to the database across all related tables.
    """

    # 1. Create the session
    session = AnalysisSession(
        filename=payload.filename,
        total_accounts=payload.summary.total_accounts_analyzed,
        suspicious_count=payload.summary.suspicious_accounts_flagged,
        rings_detected=payload.summary.fraud_rings_detected,
        processing_time=payload.summary.processing_time_seconds,
        raw_summary=json.dumps(payload.summary.model_dump()),
    )
    db.add(session)
    db.flush()  # Get session.id before inserting children

    # 2. Create suspicious accounts + patterns
    for acct_in in payload.suspicious_accounts:
        acct = SuspiciousAccount(
            session_id=session.id,
            account_id=acct_in.account_id,
            suspicion_score=acct_in.suspicion_score,
            ring_id=acct_in.ring_id,
        )
        db.add(acct)
        db.flush()

        for pattern_name in acct_in.detected_patterns:
            db.add(DetectedPattern(
                suspicious_account_id=acct.id,
                pattern_name=pattern_name,
            ))

    # 3. Create fraud rings + members
    for ring_in in payload.fraud_rings:
        ring = FraudRing(
            session_id=session.id,
            ring_id=ring_in.ring_id,
            pattern_type=ring_in.pattern_type,
            risk_score=ring_in.risk_score,
            member_count=len(ring_in.member_accounts),
        )
        db.add(ring)
        db.flush()

        for member_id in ring_in.member_accounts:
            db.add(RingMember(
                fraud_ring_id=ring.id,
                account_id=member_id,
            ))

    db.commit()
    db.refresh(session)
    return session


# ---------------------------------------------------------------
# GET /api/sessions — List all sessions (summary only)
# ---------------------------------------------------------------
@router.get(
    "",
    response_model=list[SessionSummaryOut],
    summary="List past sessions",
)
def list_sessions(db: Session = Depends(get_db)):
    """Returns all sessions ordered by most recent first."""
    sessions = (
        db.query(AnalysisSession)
        .order_by(AnalysisSession.created_at.desc())
        .all()
    )
    return sessions


# ---------------------------------------------------------------
# GET /api/sessions/{session_id} — Full session detail
# ---------------------------------------------------------------
@router.get(
    "/{session_id}",
    response_model=SessionDetailOut,
    summary="Get session detail",
)
def get_session(session_id: str, db: Session = Depends(get_db)):
    """Returns full session data including nested accounts and rings."""
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found",
        )
    return session


# ---------------------------------------------------------------
# DELETE /api/sessions/{session_id}
# ---------------------------------------------------------------
@router.delete(
    "/{session_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a session",
)
def delete_session(session_id: str, db: Session = Depends(get_db)):
    """Deletes a session and all related data (cascading)."""
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found",
        )
    db.delete(session)
    db.commit()
    return {"detail": f"Session {session_id} deleted successfully"}
