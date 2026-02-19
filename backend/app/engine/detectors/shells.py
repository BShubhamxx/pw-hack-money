"""
Pattern 3: Layered Shell Network Detection

Money passes through intermediate "shell" accounts with low transaction counts
before reaching the final destination.

Detection rules:
    - Find directed chains of 3+ hops
    - Intermediate nodes must have low total degree (2-3 total transactions)
    - These intermediaries are likely passthrough "shell" accounts

Algorithm:
    - For each node, attempt to extend a directed path
    - At each hop, check if the intermediate node is "shell-like" (low degree)
    - If a chain of 3+ valid hops is found, flag it as a shell network
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import List, Set, Dict
from ..graph import TransactionGraph


# An intermediate node is considered a "shell" if its total degree is
# between MIN_SHELL_DEGREE and MAX_SHELL_DEGREE (inclusive)
MIN_SHELL_DEGREE = 2
MAX_SHELL_DEGREE = 3

# Minimum chain length (number of hops) to flag as a shell network
MIN_CHAIN_HOPS = 3

# Maximum chain length to search (prevents runaway DFS)
MAX_CHAIN_HOPS = 8


@dataclass
class ShellChain:
    """A detected layered shell network chain."""
    members: List[str]       # All accounts in the chain (source → ... → destination)
    shell_accounts: List[str]  # Just the intermediate shell accounts
    chain_length: int        # Number of hops


def detect_shell_networks(graph: TransactionGraph) -> List[ShellChain]:
    """
    Find chains of 3+ directed hops where intermediate accounts
    have low total transaction counts (2-3 total), indicating
    passthrough shell accounts.

    Args:
        graph: TransactionGraph with adjacency lists and stats.

    Returns:
        List of ShellChain objects.
    """
    results: List[ShellChain] = []
    seen_chains: Set[tuple] = set()

    for start_node in graph.nodes:
        # Only start from nodes that are NOT shell-like themselves
        # (shells are intermediaries, not originators)
        start_stats = graph.stats.get(start_node)
        if start_stats and _is_shell_account(start_stats.total_degree):
            continue

        # DFS to find chains through shell intermediaries
        _find_chains(
            graph=graph,
            current=start_node,
            path=[start_node],
            visited={start_node},
            shells_in_path=[],
            results=results,
            seen=seen_chains,
        )

    return results


def _is_shell_account(total_degree: int) -> bool:
    """Check if an account has shell-like characteristics (low activity)."""
    return MIN_SHELL_DEGREE <= total_degree <= MAX_SHELL_DEGREE


def _find_chains(
    graph: TransactionGraph,
    current: str,
    path: List[str],
    visited: Set[str],
    shells_in_path: List[str],
    results: List[ShellChain],
    seen: Set[tuple],
) -> None:
    """
    Recursive DFS to find chains through shell (low-degree) intermediaries.

    A chain is valid when:
    - It has at least MIN_CHAIN_HOPS hops (edges, not nodes)
    - Intermediate nodes (not first or last) are shell-like

    Args:
        graph: Transaction graph.
        current: Current node in traversal.
        path: Current path from start.
        visited: Nodes in current path.
        shells_in_path: Shell accounts encountered so far.
        results: Accumulator for results.
        seen: Deduplication set.
    """
    # Check if current path is a valid chain (at least MIN_CHAIN_HOPS edges)
    hops = len(path) - 1
    if hops >= MIN_CHAIN_HOPS and len(shells_in_path) >= 1:
        chain_key = tuple(path)
        if chain_key not in seen:
            seen.add(chain_key)
            results.append(ShellChain(
                members=list(path),
                shell_accounts=list(shells_in_path),
                chain_length=hops,
            ))

    # Stop extending if we've reached max depth
    if hops >= MAX_CHAIN_HOPS:
        return

    # Extend path through neighbors
    for neighbor in graph.get_neighbors(current):
        if neighbor in visited:
            continue

        neighbor_stats = graph.stats.get(neighbor)
        if not neighbor_stats:
            continue

        # The neighbor becomes an intermediate node
        # Check if it's shell-like
        is_shell = _is_shell_account(neighbor_stats.total_degree)

        # We continue the chain if:
        # 1. The neighbor is a shell account (extend through it), OR
        # 2. The neighbor is a non-shell (could be the endpoint of the chain)
        #    but only if we already have shell intermediaries

        if is_shell:
            # Extend through shell intermediary
            visited.add(neighbor)
            path.append(neighbor)
            shells_in_path.append(neighbor)
            _find_chains(graph, neighbor, path, visited, shells_in_path, results, seen)
            shells_in_path.pop()
            path.pop()
            visited.remove(neighbor)
        elif len(shells_in_path) >= 1 and hops >= MIN_CHAIN_HOPS - 1:
            # Non-shell neighbor as endpoint (we have enough shells already)
            visited.add(neighbor)
            path.append(neighbor)
            chain_key = tuple(path)
            if chain_key not in seen:
                seen.add(chain_key)
                results.append(ShellChain(
                    members=list(path),
                    shell_accounts=list(shells_in_path),
                    chain_length=len(path) - 1,
                ))
            path.pop()
            visited.remove(neighbor)
