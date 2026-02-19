"""
Analysis Orchestrator

Pipeline: CSV bytes → parse → build graph → detect patterns → score → format output

This is the single entry point called by the upload API route.
"""

from __future__ import annotations
import time
from typing import Any, Dict, List, Set

from .parser import parse_csv, Transaction
from .graph import build_graph, TransactionGraph
from .detectors.cycles import detect_cycles
from .detectors.smurfing import detect_smurfing
from .detectors.shells import detect_shell_networks
from .scorer import score_accounts, score_ring


def analyze(csv_content: bytes) -> Dict[str, Any]:
    """
    Run the full analysis pipeline on raw CSV bytes.

    Args:
        csv_content: Raw bytes of the uploaded CSV file.

    Returns:
        A dict matching the exact JSON output schema:
        {
            "suspicious_accounts": [...],
            "fraud_rings": [...],
            "summary": {...}
        }
    """
    start_time = time.time()

    # ── Step 1: Parse CSV ──────────────────────────────────────────
    transactions = parse_csv(csv_content)

    # ── Step 2: Build Graph ────────────────────────────────────────
    graph = build_graph(transactions)

    # ── Step 3: Run Detectors (with Timeout Protection) ────────────
    import concurrent.futures

    def run_detectors():
        return (
            detect_cycles(graph),
            detect_smurfing(graph),
            detect_shell_networks(graph),
        )

    try:
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(run_detectors)
            # Give detectors 15 seconds max to complete
            cycle_rings, smurfing_rings, shell_chains = future.result(timeout=15)
    except concurrent.futures.TimeoutError:
        print("WARNING: Detectors timed out, proceeding with empty results.")
        cycle_rings, smurfing_rings, shell_chains = [], [], []

    # ── Step 4: Aggregate Results ──────────────────────────────────
    # Track per-account pattern involvement
    account_patterns: Dict[str, Set[str]] = {}       # account → set of pattern types
    account_ring_ids: Dict[str, str] = {}             # account → primary ring_id
    account_involvement: Dict[str, int] = {}          # account → ring count
    account_pattern_details: Dict[str, Set[str]] = {} # account → specific pattern labels

    fraud_rings: List[Dict[str, Any]] = []
    ring_counter = 0

    # Process cycle rings
    for cr in cycle_rings:
        ring_counter += 1
        ring_id = f"RING_{ring_counter:03d}"
        for member in cr.members:
            account_patterns.setdefault(member, set()).add("cycle")
            account_pattern_details.setdefault(member, set()).add(f"cycle_length_{cr.length}")
            account_ring_ids[member] = ring_id
            account_involvement[member] = account_involvement.get(member, 0) + 1

        fraud_rings.append({
            "ring_id": ring_id,
            "member_accounts": cr.members,
            "pattern_type": "cycle",
            "members_raw": cr.members,
        })

    # Process smurfing rings
    for sr in smurfing_rings:
        ring_counter += 1
        ring_id = f"RING_{ring_counter:03d}"
        for member in sr.members:
            account_patterns.setdefault(member, set()).add("smurfing")
            account_pattern_details.setdefault(member, set()).add(sr.pattern)
            account_ring_ids[member] = ring_id
            account_involvement[member] = account_involvement.get(member, 0) + 1

        fraud_rings.append({
            "ring_id": ring_id,
            "member_accounts": sr.members,
            "pattern_type": "smurfing",
            "members_raw": sr.members,
        })

    # Process shell chains
    for sc in shell_chains:
        ring_counter += 1
        ring_id = f"RING_{ring_counter:03d}"
        for member in sc.members:
            account_patterns.setdefault(member, set()).add("layered_shell")
            detail = "layered_shell"
            if member in sc.shell_accounts:
                detail = "shell_intermediary"
            account_pattern_details.setdefault(member, set()).add(detail)
            account_ring_ids[member] = ring_id
            account_involvement[member] = account_involvement.get(member, 0) + 1

        fraud_rings.append({
            "ring_id": ring_id,
            "member_accounts": sc.members,
            "pattern_type": "layered_shell",
            "members_raw": sc.members,
        })

    # ── Step 5: Score ──────────────────────────────────────────────
    account_scores = score_accounts(account_patterns, account_involvement)

    # Score each ring
    for ring in fraud_rings:
        member_scores = [account_scores.get(m, 0) for m in ring["members_raw"]]
        ring["risk_score"] = score_ring(member_scores, ring["pattern_type"])

    # ── Step 6: Format Output ──────────────────────────────────────
    processing_time = round(time.time() - start_time, 2)

    # Build suspicious_accounts (sorted by score descending)
    suspicious_accounts = []
    for account_id, score in sorted(account_scores.items(), key=lambda x: -x[1]):
        patterns = list(account_pattern_details.get(account_id, set()))
        ring_id = account_ring_ids.get(account_id, "UNKNOWN")
        suspicious_accounts.append({
            "account_id": account_id,
            "suspicion_score": score,
            "detected_patterns": patterns,
            "ring_id": ring_id,
        })

    # Build fraud_rings output (clean up internal fields)
    fraud_rings_out = []
    for ring in fraud_rings:
        fraud_rings_out.append({
            "ring_id": ring["ring_id"],
            "member_accounts": ring["member_accounts"],
            "pattern_type": ring["pattern_type"],
            "risk_score": ring["risk_score"],
        })

    # ── Step 7: Build graph visualization data ────────────────────
    graph_nodes = []
    for node_id in graph.nodes:
        node_stats = graph.stats.get(node_id, None)
        total_txns = node_stats.total_txn_count if node_stats else 0
        pattern_set = account_patterns.get(node_id, set())
        # Normalize pattern type for frontend CSS classes
        raw_pattern = next(iter(pattern_set), None)
        pattern_type = None
        if raw_pattern == "layered_shell":
            pattern_type = "shell"
        elif raw_pattern:
            pattern_type = raw_pattern

        graph_nodes.append({
            "id": node_id,
            "riskScore": account_scores.get(node_id, 0),
            "suspicious": node_id in account_scores,
            "ringId": account_ring_ids.get(node_id),
            "patternType": pattern_type,
            "totalTransactions": total_txns,
        })

    graph_edges = []
    for sender, edges_list in graph.adj.items():
        for edge in edges_list:
            graph_edges.append({
                "id": edge.transaction_id,
                "source": sender,
                "target": edge.target,
                "amount": edge.amount,
                "timestamp": edge.timestamp.isoformat(),
            })

    return {
        "suspicious_accounts": suspicious_accounts,
        "fraud_rings": fraud_rings_out,
        "graph": {
            "nodes": graph_nodes,
            "edges": graph_edges,
            "rings": [
                {
                    "ringId": r["ring_id"],
                    "patternType": "shell" if "shell" in r["pattern_type"] else r["pattern_type"],
                    "memberCount": len(r["member_accounts"]),
                    "riskScore": r["risk_score"],
                    "members": r["member_accounts"],
                }
                for r in fraud_rings_out
            ],
        },
        "summary": {
            "total_accounts_analyzed": graph.node_count,
            "suspicious_accounts_flagged": len(suspicious_accounts),
            "fraud_rings_detected": len(fraud_rings_out),
            "processing_time_seconds": processing_time,
        },
    }
