# Money Muling Detection Engine

A web-based Financial Forensics Engine that processes transaction data and exposes money muling networks through graph analysis and visualization.

> **Note:** If the deployed site doesn't work through mobile data/internet, try connecting via WiFi instead.

---

## Overview

This tool leverages **graph theory** to detect and visualize complex money muling patterns that traditional linear database queries often miss. It helps financial forensic analysts identify:

- **Circular Routing (Cycles)** — Closed loops of 3-5 nodes indicating circular money flow
- **Smurfing (Fan-in/Fan-out)** — Accounts with 10+ incoming/outgoing transactions within 72-hour windows
- **Layered Shell Networks** — Transaction chains with 3+ hops through low-activity intermediary accounts

---

## Features

- **CSV Upload** — Drag-and-drop transaction data upload with schema validation
- **Graph Construction** — Automatic directed graph generation from transactions
- **Pattern Detection** — Algorithmic detection of cycles, smurfing, and shell networks
- **Risk Scoring** — Suspicion scores (0-100) for accounts and fraud rings
- **Interactive Visualization** — Node-link graph with highlighted suspicious nodes
- **Export Results** — Download analysis results as formatted JSON
- **Analytics Dashboard** — Summary metrics and fraud ring tables

---

## Tech Stack

### Backend
- **Python 3.12** with FastAPI
- **SQLAlchemy** for database ORM
- **Pydantic** for data validation
- **NetworkX-style** graph algorithms for detection

### Frontend
- **Next.js 16** with React 19
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Shadcn UI** for components
- **Cytoscape.js** for graph visualization
- **Recharts** for analytics charts
- **Tanstack Table** for data tables

### Deployment
- **Railway** (Backend API)
- **Vercel** (Frontend)

---

## Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
# Navigate to project root
cd pw-hack-money

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the backend server
cd backend
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

---

## CSV Input Format

Upload transaction data with the following schema:

| Column | Type | Format |
|--------|------|--------|
| `transaction_id` | String | Unique identifier |
| `sender_id` | String | Sender account ID |
| `receiver_id` | String | Receiver account ID |
| `amount` | Float | Transaction amount |
| `timestamp` | DateTime | `YYYY-MM-DD HH:MM:SS` |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/upload` | POST | Upload CSV for analysis |
| `/sessions` | GET | List analysis sessions |
| `/sessions/{id}` | GET | Get session results |

---

## Output Format

The analysis returns JSON with:

```json
{
  "suspicious_accounts": [
    {
      "account_id": "ACC123",
      "suspicion_score": 85,
      "detected_patterns": ["cycle", "smurfing"],
      "ring_id": "RING001"
    }
  ],
  "fraud_rings": [
    {
      "ring_id": "RING001",
      "member_accounts": ["ACC123", "ACC456", "ACC789"],
      "pattern_type": "cycle",
      "risk_score": 78
    }
  ],
  "summary": {
    "total_accounts": 1500,
    "flagged_accounts": 45,
    "rings_detected": 8,
    "processing_time_seconds": 2.3
  }
}
```

---

## Project Structure

```
pw-hack-money/
├── backend/
│   └── app/
│       ├── main.py              # FastAPI application entry
│       ├── engine/              # Detection algorithms
│       │   ├── analyzer.py      # Main analysis orchestrator
│       │   ├── graph.py         # Graph construction
│       │   ├── parser.py        # CSV parsing
│       │   ├── scorer.py        # Risk scoring
│       │   └── detectors/       # Pattern detection modules
│       │       ├── cycles.py    # Cycle detection
│       │       ├── shells.py    # Shell network detection
│       │       └── smurfing.py  # Smurfing detection
│       └── routes/              # API endpoints
├── frontend/
│   ├── app/                     # Next.js pages
│   │   ├── dashboard/           # Results dashboard
│   │   ├── analytics/           # Analytics view
│   │   ├── upload/              # CSV upload page
│   │   └── history/             # Session history
│   └── components/              # React components
│       ├── analytics/           # Analytics components
│       └── ui/                  # Shadcn UI components
└── db/                          # Database models & schemas
```

---

## License

This project was built for a hackathon demonstration. Use responsibly.
