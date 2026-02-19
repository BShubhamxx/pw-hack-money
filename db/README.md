# 📦 `db/` — Shared Database Layer

This folder contains the **database models, Pydantic schemas, and connection setup** used by the FastAPI backend. It is placed at the project root so that both the backend and frontend teams can reference the data structures.

## Files

| File | Purpose |
|------|---------|
| `models.py` | SQLAlchemy ORM models defining the 5 database tables |
| `database.py` | Engine creation, session factory, and `init_db()` function |
| `schemas.py` | Pydantic schemas — **frontend devs: reference this for API shapes** |

## Schema Overview

```
AnalysisSession
├── SuspiciousAccount[]
│   └── DetectedPattern[]         (e.g. "cycle_length_3", "fan_in")
└── FraudRing[]
    └── RingMember[]              (account IDs in the ring)
```

## Quick Reference for Frontend

### `POST /api/sessions` — Save analysis results

**Request body** (see `AnalysisResultIn` in `schemas.py`):

```json
{
  "filename": "transactions.csv",
  "suspicious_accounts": [
    {
      "account_id": "ACC_00123",
      "suspicion_score": 87.5,
      "detected_patterns": ["cycle_length_3", "high_velocity"],
      "ring_id": "RING_001"
    }
  ],
  "fraud_rings": [
    {
      "ring_id": "RING_001",
      "member_accounts": ["ACC_00123", "ACC_00456"],
      "pattern_type": "cycle",
      "risk_score": 95.3
    }
  ],
  "summary": {
    "total_accounts_analyzed": 500,
    "suspicious_accounts_flagged": 15,
    "fraud_rings_detected": 4,
    "processing_time_seconds": 2.3
  }
}
```

### `GET /api/sessions` — List past sessions

Returns `SessionSummaryOut[]` — lightweight metadata (no nested accounts/rings).

### `GET /api/sessions/{id}` — Full session detail

Returns `SessionDetailOut` — includes nested `suspicious_accounts` and `fraud_rings`.

### `DELETE /api/sessions/{id}` — Remove a session

Cascading delete removes all related accounts, patterns, rings, and members.
