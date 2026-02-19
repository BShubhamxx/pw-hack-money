"""
Pattern 2: Smurfing Detection — Fan-in / Fan-out

Smurfing involves many small deposits aggregated into one account (fan-in),
then quickly dispersed to many accounts (fan-out) to avoid reporting thresholds.

Detection rules:
    Fan-in:  ≥10 unique senders → 1 receiver within a 72-hour window
    Fan-out: 1 sender → ≥10 unique receivers within a 72-hour window

Algorithm:
    - For each node, collect incoming (or outgoing) transactions
    - Sort by timestamp
    - Use a sliding 72-hour window to count unique counterparties
    - Flag the node + its counterparties if threshold is met
"""

from __future__ import annotations
from dataclasses import dataclass
from datetime import timedelta
from typing import List, Dict, Set, Tuple
from ..graph import TransactionGraph, Edge


WINDOW_HOURS = 72
THRESHOLD = 10  # Minimum unique counterparties to flag


@dataclass
class SmurfingRing:
    """A detected smurfing pattern."""
    hub_account: str          # The aggregator/disperser node
    counterparties: List[str] # The many small accounts
    pattern: str              # "fan_in" or "fan_out"
    members: List[str]        # hub + counterparties (all ring members)


def detect_smurfing(graph: TransactionGraph) -> List[SmurfingRing]:
    """
    Detect fan-in and fan-out smurfing patterns using 72-hour temporal windows.

    Args:
        graph: TransactionGraph with adjacency lists.

    Returns:
        List of SmurfingRing objects.
    """
    results: List[SmurfingRing] = []
    
    # Track already-flagged hubs to avoid duplicate rings
    flagged_fan_in: Set[str] = set()
    flagged_fan_out: Set[str] = set()

    for node in graph.nodes:
        # --- Fan-in: many senders → this node ---
        incoming = graph.get_incoming_edges(node)
        if len(incoming) >= THRESHOLD and node not in flagged_fan_in:
            fan_in_partners = _check_temporal_window(incoming)
            if fan_in_partners:
                flagged_fan_in.add(node)
                members = [node] + list(fan_in_partners)
                results.append(SmurfingRing(
                    hub_account=node,
                    counterparties=list(fan_in_partners),
                    pattern="fan_in",
                    members=members,
                ))

        # --- Fan-out: this node → many receivers ---
        outgoing = graph.get_outgoing_edges(node)
        if len(outgoing) >= THRESHOLD and node not in flagged_fan_out:
            fan_out_partners = _check_temporal_window_outgoing(outgoing)
            if fan_out_partners:
                flagged_fan_out.add(node)
                members = [node] + list(fan_out_partners)
                results.append(SmurfingRing(
                    hub_account=node,
                    counterparties=list(fan_out_partners),
                    pattern="fan_out",
                    members=members,
                ))

    return results


def _check_temporal_window(edges: List[Edge]) -> Set[str] | None:
    """
    Check if ≥THRESHOLD unique counterparties (edge.target = sender via reverse adj)
    exist within any 72-hour window.

    Args:
        edges: Incoming edges (from reverse adjacency — edge.target is the sender).

    Returns:
        Set of counterparty IDs if threshold met, else None.
    """
    if len(edges) < THRESHOLD:
        return None

    # Sort by timestamp
    sorted_edges = sorted(edges, key=lambda e: e.timestamp)
    window = timedelta(hours=WINDOW_HOURS)

    best_partners: Set[str] = set()

    # Sliding window approach
    left = 0
    for right in range(len(sorted_edges)):
        # Shrink window from left if outside 72h
        while sorted_edges[right].timestamp - sorted_edges[left].timestamp > window:
            left += 1

        # Collect unique counterparties in current window
        current_partners = set()
        for i in range(left, right + 1):
            current_partners.add(sorted_edges[i].target)

        if len(current_partners) >= THRESHOLD and len(current_partners) > len(best_partners):
            best_partners = current_partners

    return best_partners if len(best_partners) >= THRESHOLD else None


def _check_temporal_window_outgoing(edges: List[Edge]) -> Set[str] | None:
    """
    Check if ≥THRESHOLD unique receivers exist within any 72-hour window.

    Args:
        edges: Outgoing edges (edge.target = receiver).

    Returns:
        Set of receiver IDs if threshold met, else None.
    """
    if len(edges) < THRESHOLD:
        return None

    sorted_edges = sorted(edges, key=lambda e: e.timestamp)
    window = timedelta(hours=WINDOW_HOURS)

    best_partners: Set[str] = set()

    left = 0
    for right in range(len(sorted_edges)):
        while sorted_edges[right].timestamp - sorted_edges[left].timestamp > window:
            left += 1

        current_partners = set()
        for i in range(left, right + 1):
            current_partners.add(sorted_edges[i].target)

        if len(current_partners) >= THRESHOLD and len(current_partners) > len(best_partners):
            best_partners = current_partners

    return best_partners if len(best_partners) >= THRESHOLD else None
