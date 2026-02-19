"""
Upload & Analyze Route

POST /api/upload — accepts a CSV file, runs the detection pipeline,
persists results to the database, and returns the formatted JSON.
"""

import json
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import (
    AnalysisSession,
    SuspiciousAccount,
    DetectedPattern,
    FraudRing,
    RingMember,
)
from backend.app.engine.analyzer import analyze
from backend.app.engine.parser import CSVParseError

router = APIRouter(prefix="/api", tags=["upload"])


@router.post(
    "/upload",
    status_code=status.HTTP_200_OK,
    summary="Upload CSV and run analysis",
    response_description="Full analysis result with suspicious accounts, fraud rings, and summary",
)
def upload_and_analyze(
    file: UploadFile = File(..., description="CSV file with transaction data"),
    db: Session = Depends(get_db),
):
    """
    Upload a CSV file containing transaction data.
    The engine will:
        1. Parse and validate the CSV
        2. Build a directed transaction graph
        3. Run all 3 detection algorithms (cycles, smurfing, shell networks)
        4. Score accounts and rings
        5. Persist results to the database
        6. Return the formatted JSON result
    """

    # Validate file type
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are accepted. Please upload a .csv file.",
        )

    # Read file content
    content = file.file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # Run analysis pipeline
    try:
        result = analyze(content)
    except CSVParseError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}",
        )

    # ── Persist to database ───────────────────────────────────────
    summary = result["summary"]

    session_record = AnalysisSession(
        filename=file.filename or "unknown.csv",
        total_accounts=summary["total_accounts_analyzed"],
        suspicious_count=summary["suspicious_accounts_flagged"],
        rings_detected=summary["fraud_rings_detected"],
        processing_time=summary["processing_time_seconds"],
        raw_summary=json.dumps(summary),
    )
    db.add(session_record)
    db.flush()

    # Save suspicious accounts
    for acct in result["suspicious_accounts"]:
        sa = SuspiciousAccount(
            session_id=session_record.id,
            account_id=acct["account_id"],
            suspicion_score=acct["suspicion_score"],
            ring_id=acct["ring_id"],
        )
        db.add(sa)
        db.flush()

        for pattern_name in acct["detected_patterns"]:
            db.add(DetectedPattern(
                suspicious_account_id=sa.id,
                pattern_name=pattern_name,
            ))

    # Save fraud rings
    for ring in result["fraud_rings"]:
        fr = FraudRing(
            session_id=session_record.id,
            ring_id=ring["ring_id"],
            pattern_type=ring["pattern_type"],
            risk_score=ring["risk_score"],
            member_count=len(ring["member_accounts"]),
        )
        db.add(fr)
        db.flush()

        for member_id in ring["member_accounts"]:
            db.add(RingMember(
                fraud_ring_id=fr.id,
                account_id=member_id,
            ))

    db.commit()

    # Add session_id to the response
    result["session_id"] = session_record.id

    return result
