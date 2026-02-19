# Product Requirements Document (PRD): Money Muling Detection Engine

## 1. Executive Summary
**Project Name:** Money Muling Detection Engine
**Objective:** specific web-based forensic tool to detect money muling networks (cycles, smurfing, shell networks) from transaction data using graph algorithms.
**Target Audience:** Financial forensic analysts.

## 2. Problem Statement
Money muling involves complex networks of transactions designed to obscure the origin of illicit funds. Traditional linear database queries struggle to detect these patterns. This tool leverages graph theory to visualize and identify these fraudulent rings.

## 3. Scope
### In-Scope
-   CSV File Upload handling.
-   Graph Construction from transaction data.
-   Detection of:
    -   Circular Routing (Cycles of length 3-5).
    -   Smurfing (Fan-in/Fan-out) specifically within 72-hour windows.
    -   Layered Shell Networks (3+ hops, low activity).
-   Interactive Graph Visualization.
-   Export of results in specifically formatted JSON.
-   Summary Dashboard/Table of detected rings.

### Out-of-Scope (for MVP)
-   Real-time streaming data (batch upload only).
-   User authentication (as per hackathon rules "no authentication").
-   Persistent database storage (in-memory processing acceptable for session).

## 4. User Flow
1.  **Landing Page:** User sees project title, brief description, and a "Upload CSV" drag-and-drop zone.
2.  **Processing:** User uploads file -> System parses -> Builds Graph -> Runs Algorithms -> Returns Results. (Must be < 30s).
3.  **Dashboard/Results View:**
    -   **Summary Metrics:** Total accounts, flagged accounts, rings detected, processing time.
    -   **Graph View:** Visual node-link diagram.
    -   **Ring Table:** List of detected fraud rings with details.
4.  **Export:** User clicks "Download Results" to get the `results.json`.

## 5. Functional Requirements

### 5.1 Input Module
-   **File Format:** CSV.
-   **Schema Validation:**
    -   `transaction_id` (String)
    -   `sender_id` (String)
    -   `receiver_id` (String)
    -   `amount` (Float)
    -   `timestamp` (DateTime: YYYY-MM-DD HH:MM:SS)

### 5.2 Core Detection Logic (The Brain)
-   **Graph Construction:** Nodes = Accounts, Directed Edges = Transactions (weighted by amount/time).
-   **Pattern 1: Cycle Detection:**
    -   DFS/BFS to find closed loops.
    -   Constraint: Length 3 to 5 nodes.
-   **Pattern 2: Smurfing (Fan-in/Fan-out):**
    -   Fan-in: >10 incoming edges to one node within 72h.
    -   Fan-out: One node >10 outgoing edges within 72h.
-   **Pattern 3: Layered Shells:**
    -   Path finding: Chain length > 3.
    -   Node Property Check: Intermediate nodes have low total degree (e.g., 2-3 total txns).
-   **Scoring System:**
    -   Assign suspicion scores (0-100) based on involvement in patterns.

### 5.3 Output Module
-   **JSON Export:** exact schema required by headers.
    -   `suspicious_accounts`: list with ID, score, patterns, ring_id.
    -   `fraud_rings`: list with ID, members, type, risk_score.
    -   `summary`: stats.
-   **UI Table:** Ring ID, Pattern Type, Member IDs, Risk Score.

### 5.4 Visualization
-   Render nodes and edges.
-   **Visual Cues:**
    -   Red/High-contrast for suspicious nodes.
    -   Thicker edges for high amounts (optional).
    -   Highlight specific rings when selected from the table.
-   **Interactivity:** Click node to see details (ID, Total In/Out, flagged reason).

## 6. Technical Requirements
-   **Frontend:** Next.js / React + Shadcn UI (for table/layout) + Recharts/D3/Vis.js/React-Force-Graph (for visualization).
-   **Backend:** Next.js API Routes.
-   **Performance:** < 30 seconds for 10k transactions.
-   **Deployment:** Vercel (public access).

## 7. Bonus / Advanced Features (Phase 2)
-   **Advanced Temporal View:** Time-slider to see money flow evolve.
-   **Geospatial Mapping:** If IP/Location data were simulated (not in current schema though).
-   **AI/ML Layer:** Anomaly detection using Isolation Forest (beyond heuristic rules).
-   **3D Graph View:** For "wow" factor.