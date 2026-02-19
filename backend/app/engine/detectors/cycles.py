"""
Pattern 1: Circular Fund Routing — Cycle Detection

Detects closed loops where money flows in a circle:
    A → B → C → A  (cycle of length 3)
    A → B → C → D → A  (cycle of length 4)

Algorithm:
    - DFS-based cycle finder on the directed transaction graph
    - Constrained to cycles of length 3 to 5
    - Deduplicates cycles (A→B→C→A is the same ring as B→C→A→B)
    - Groups all accounts in a cycle as a single fraud ring
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Set, Dict
from ..graph import TransactionGraph


@dataclass
class CycleRing:
    """A detected circular routing ring."""
    members: List[str]
    length: int


def detect_cycles(graph: TransactionGraph, min_length: int = 3, max_length: int = 5) -> List[CycleRing]:
    """
    Find all unique directed cycles of length min_length to max_length.

    Uses a bounded DFS from every node. Cycles are deduplicated by normalizing
    the member list (rotate so the smallest ID is first).

    Args:
        graph: TransactionGraph with adjacency lists.
        min_length: Minimum cycle length (default 3).
        max_length: Maximum cycle length (default 5).

    Returns:
        List of CycleRing objects, each containing the member account IDs.
    """
    found_cycles: Set[tuple] = set()
    results: List[CycleRing] = []

    for start_node in graph.nodes:
        # Bounded DFS from each node
        _dfs_find_cycles(
            graph=graph,
            start=start_node,
            current=start_node,
            path=[start_node],
            visited={start_node},
            min_length=min_length,
            max_length=max_length,
            found=found_cycles,
        )

    # Convert deduplicated cycle tuples into CycleRing objects
    for cycle_key in found_cycles:
        results.append(CycleRing(
            members=list(cycle_key),
            length=len(cycle_key),
        ))

    return results


def _dfs_find_cycles(
    graph: TransactionGraph,
    start: str,
    current: str,
    path: List[str],
    visited: Set[str],
    min_length: int,
    max_length: int,
    found: Set[tuple],
) -> None:
    """
    Recursive bounded DFS to discover cycles starting and ending at `start`.

    Args:
        graph: The transaction graph.
        start: The origin node we're trying to loop back to.
        current: The current node in the DFS traversal.
        path: Current path from start to current.
        visited: Set of nodes already in the current path (prevents revisits).
        min_length: Minimum cycle length.
        max_length: Maximum cycle length.
        found: Set of normalized cycle tuples (for deduplication).
    """
    for neighbor in graph.get_neighbors(current):
        # Found a cycle back to start
        if neighbor == start and len(path) >= min_length:
            normalized = _normalize_cycle(path)
            found.add(normalized)
            continue

        # Extend path if within bounds and not revisiting
        if neighbor not in visited and len(path) < max_length:
            visited.add(neighbor)
            path.append(neighbor)
            _dfs_find_cycles(graph, start, neighbor, path, visited, min_length, max_length, found)
            path.pop()
            visited.remove(neighbor)


def _normalize_cycle(cycle: List[str]) -> tuple:
    """
    Normalize a cycle so that the smallest account ID is first.
    This ensures A→B→C→A and B→C→A→B produce the same key.

    Args:
        cycle: List of account IDs forming the cycle.

    Returns:
        A tuple of account IDs starting with the lexicographically smallest.
    """
    if not cycle:
        return ()

    min_idx = cycle.index(min(cycle))
    normalized = cycle[min_idx:] + cycle[:min_idx]
    return tuple(normalized)
