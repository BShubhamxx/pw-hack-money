# Core Logic Implementation Plan (Client-Side)

## Phase 1: Logic Setup & CSV Parsing
- [ ] Create Logic Module: `src/logic/analyzer.ts`.
- [ ] Parse incoming CSV file using `papaparse` (in browser).
- [ ] Validate schema — reject if columns are missing or types are wrong.
- [ ] Define TypeScript interfaces:
  ```
  Transaction { transaction_id, sender_id, receiver_id, amount, timestamp }
  Graph { nodes: Map, edges: List }
  SuspiciousAccount { account_id, suspicion_score, detected_patterns, ring_id }
  FraudRing { ring_id, member_accounts, pattern_type, risk_score }
  AnalysisResult { suspicious_accounts, fraud_rings, summary }
  ```

## Phase 2: Graph Construction
- [ ] Build directed graph from parsed transactions:
  - [ ] Nodes = unique `sender_id` + `receiver_id`.
  - [ ] Edges = directed, from sender → receiver, with `amount` and `timestamp` as metadata.
- [ ] Create adjacency list representation for efficient traversal.
- [ ] Pre-compute node stats: in-degree, out-degree, total transaction count.

## Phase 3: Detection Algorithms
### 3a. Cycle Detection (Circular Routing)
- [ ] Implement DFS-based cycle finder for directed graphs.
- [ ] Constrain to cycles of length 3 to 5.
- [ ] Group cycle members into `FraudRing` objects with `pattern_type: "cycle"`.

### 3b. Smurfing Detection (Fan-in / Fan-out)
- [ ] For each node, group incoming transactions by 72-hour time windows.
- [ ] Flag as **Fan-in** if any window has ≥10 unique senders.
- [ ] For each node, group outgoing transactions by 72-hour time windows.
- [ ] Flag as **Fan-out** if any window has ≥10 unique receivers.
- [ ] Group related fan-in/fan-out nodes into rings with `pattern_type: "smurfing"`.

### 3c. Shell Network Detection (Layered)
- [ ] Find chains of 3+ directed hops.
- [ ] Check if intermediate nodes have low activity (total degree 2-3).
- [ ] Flag chains as `pattern_type: "layered_shell"`.

## Phase 4: Scoring & Output Formatting
- [ ] **Suspicion Score (0-100):**
  - [ ] Base score per pattern: Cycle = 40, Smurfing = 30, Shell = 30.
  - [ ] Multiply by involvement count (capped at 100).
  - [ ] Bonus for appearing in multiple distinct patterns.
- [ ] **Ring Risk Score (0-100):**
  - [ ] Average of member suspicion scores + pattern severity weight.
- [ ] Format final JSON output to match the **exact** required schema.
- [ ] Sort `suspicious_accounts` by `suspicion_score` descending.
- [ ] Include `summary` with processing time.

## Phase 5: Performance & Edge Cases
- [ ] Optimize: ensure < 30s for 10k transactions.
- [ ] Handle edge cases: empty CSV, duplicate transactions, self-loops.
- [ ] Avoid false positives: skip nodes with high, consistent volume (likely merchants/payroll).
- [ ] Return meaningful error messages for malformed input.
