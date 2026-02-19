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

    # ── Step 3: Run Detectors ──────────────────────────────────────
    cycle_rings = detect_cycles(graph)
    smurfing_rings = detect_smurfing(graph)
    shell_chains = detect_shell_networks(graph)

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

    return {
        "suspicious_accounts": suspicious_accounts,
        "fraud_rings": fraud_rings_out,
        "summary": {
            "total_accounts_analyzed": graph.node_count,
            "suspicious_accounts_flagged": len(suspicious_accounts),
            "fraud_rings_detected": len(fraud_rings_out),
            "processing_time_seconds": processing_time,
        },
    }
