"""
Pattern 1: Circular Fund Routing — Cycle Detection

Detects closed loops where money flows in a circle:
    A → B → C → A  (cycle of length 3)
    A → B → C → D → A  (cycle of length 4)

Algorithm:
    - Iterative DFS-based cycle finder on the directed transaction graph
    - Pre-filters to only start from nodes with both in-degree and out-degree > 0
    - Constrained to cycles of length 3 to 5
    - Deduplicates cycles (A→B→C→A is the same ring as B→C→A→B)
    - Hard iteration limit (100K steps) to guarantee termination on dense graphs
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import List, Set
from ..graph import TransactionGraph


# Safety limits to prevent combinatorial explosion on dense graphs
MAX_ITERATIONS = 100_000  # Hard cap on DFS steps
MAX_CYCLES = 50           # Stop after finding this many unique cycles


@dataclass
class CycleRing:
    """A detected circular routing ring."""
    members: List[str]
    length: int


def detect_cycles(
    graph: TransactionGraph,
    min_length: int = 3,
    max_length: int = 5,
) -> List[CycleRing]:
    """
    Find unique directed cycles of length min_length to max_length.

    Uses an iterative bounded DFS from candidate nodes only (nodes that have
    both in-degree and out-degree > 0). Includes a hard iteration limit
    to prevent hangs on dense graphs.

    Args:
        graph: TransactionGraph with adjacency lists.
        min_length: Minimum cycle length (default 3).
        max_length: Maximum cycle length (default 5).

    Returns:
        List of CycleRing objects, each containing the member account IDs.
    """
    found_cycles: Set[tuple] = set()
    iteration_count = 0

    # Pre-filter: only consider nodes that can participate in a cycle
    # (must have both incoming and outgoing edges)
    candidates = sorted([
        n for n in graph.nodes
        if graph.stats.get(n)
        and graph.stats[n].in_degree > 0
        and graph.stats[n].out_degree > 0
    ])

    for start_node in candidates:
        if len(found_cycles) >= MAX_CYCLES or iteration_count >= MAX_ITERATIONS:
            break

        # Iterative DFS using an explicit stack
        # Stack items: (current_node, path, visited_set, neighbor_index)
        neighbors_of_start = graph.get_neighbors(start_node)
        stack: list[tuple[str, list[str], set[str], int]] = [
            (start_node, [start_node], {start_node}, 0)
        ]

        while stack:
            iteration_count += 1
            if iteration_count >= MAX_ITERATIONS or len(found_cycles) >= MAX_CYCLES:
                break

            current, path, visited, neighbor_idx = stack.pop()
            neighbors = graph.get_neighbors(current)

            for i in range(neighbor_idx, len(neighbors)):
                neighbor = neighbors[i]
                iteration_count += 1
                if iteration_count >= MAX_ITERATIONS or len(found_cycles) >= MAX_CYCLES:
                    break

                # Found a cycle back to start
                if neighbor == start_node and len(path) >= min_length:
                    normalized = _normalize_cycle(path)
                    found_cycles.add(normalized)
                    continue

                # Extend path if within bounds and not revisiting
                if neighbor not in visited and len(path) < max_length:
                    # Push current state with next neighbor index for backtracking
                    stack.append((current, path[:], visited.copy(), i + 1))
                    # Push new state
                    new_path = path + [neighbor]
                    new_visited = visited | {neighbor}
                    stack.append((neighbor, new_path, new_visited, 0))
                    break  # Process new node next
            # If we exhausted all neighbors, backtracking happens naturally (pop next from stack)

    # Convert to CycleRing objects
    results = [
        CycleRing(members=list(cycle_key), length=len(cycle_key))
        for cycle_key in found_cycles
    ]
    return results


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
