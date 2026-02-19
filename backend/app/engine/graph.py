"""
Directed graph construction from transaction data.

Builds an adjacency-list representation where:
  - Nodes  = unique account IDs (sender + receiver)
  - Edges  = directed, from sender → receiver, with amount + timestamp metadata
"""

from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Set
from .parser import Transaction


@dataclass
class Edge:
    """A directed edge in the transaction graph."""
    target: str
    amount: float
    timestamp: datetime
    transaction_id: str


@dataclass
class NodeStats:
    """Pre-computed statistics for a node."""
    in_degree: int = 0
    out_degree: int = 0
    total_in_amount: float = 0.0
    total_out_amount: float = 0.0

    @property
    def total_degree(self) -> int:
        return self.in_degree + self.out_degree

    @property
    def total_txn_count(self) -> int:
        return self.in_degree + self.out_degree


class TransactionGraph:
    """
    Directed graph built from transaction records.

    Attributes:
        adj:        Adjacency list — adj[sender] = [Edge, ...]
        reverse_adj: Reverse adjacency — reverse_adj[receiver] = [Edge(target=sender), ...]
        nodes:      Set of all unique account IDs.
        stats:      Per-node statistics (in/out degree, amounts).
        incoming:   incoming[receiver] = [(sender, amount, timestamp, txn_id), ...]
    """

    def __init__(self) -> None:
        self.adj: Dict[str, List[Edge]] = {}
        self.reverse_adj: Dict[str, List[Edge]] = {}
        self.nodes: Set[str] = set()
        self.stats: Dict[str, NodeStats] = {}
        self.incoming: Dict[str, List[tuple]] = {}

    def add_transaction(self, txn: Transaction) -> None:
        """Add a single transaction as a directed edge."""
        sender = txn.sender_id
        receiver = txn.receiver_id

        # Register nodes
        self.nodes.add(sender)
        self.nodes.add(receiver)

        # Forward edge: sender → receiver
        if sender not in self.adj:
            self.adj[sender] = []
        self.adj[sender].append(Edge(
            target=receiver,
            amount=txn.amount,
            timestamp=txn.timestamp,
            transaction_id=txn.transaction_id,
        ))

        # Reverse edge: receiver ← sender (for fan-in analysis)
        if receiver not in self.reverse_adj:
            self.reverse_adj[receiver] = []
        self.reverse_adj[receiver].append(Edge(
            target=sender,
            amount=txn.amount,
            timestamp=txn.timestamp,
            transaction_id=txn.transaction_id,
        ))

        # Track incoming transactions per receiver
        if receiver not in self.incoming:
            self.incoming[receiver] = []
        self.incoming[receiver].append((sender, txn.amount, txn.timestamp, txn.transaction_id))

        # Update stats
        if sender not in self.stats:
            self.stats[sender] = NodeStats()
        if receiver not in self.stats:
            self.stats[receiver] = NodeStats()

        self.stats[sender].out_degree += 1
        self.stats[sender].total_out_amount += txn.amount
        self.stats[receiver].in_degree += 1
        self.stats[receiver].total_in_amount += txn.amount

    def get_neighbors(self, node: str) -> List[str]:
        """Get outgoing neighbors of a node."""
        return [e.target for e in self.adj.get(node, [])]

    def get_outgoing_edges(self, node: str) -> List[Edge]:
        """Get outgoing edges from a node."""
        return self.adj.get(node, [])

    def get_incoming_edges(self, node: str) -> List[Edge]:
        """Get incoming edges to a node (via reverse adjacency)."""
        return self.reverse_adj.get(node, [])

    @property
    def node_count(self) -> int:
        return len(self.nodes)

    @property
    def edge_count(self) -> int:
        return sum(len(edges) for edges in self.adj.values())


def build_graph(transactions: List[Transaction]) -> TransactionGraph:
    """
    Construct a directed graph from a list of transactions.

    Args:
        transactions: List of parsed Transaction objects.

    Returns:
        A TransactionGraph with adjacency lists and pre-computed stats.
    """
    graph = TransactionGraph()
    for txn in transactions:
        graph.add_transaction(txn)
    return graph
