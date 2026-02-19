"""
Suspicion Scoring System

Assigns scores to flagged accounts and fraud rings:

Account score (0-100):
    - Base per pattern: cycle = 40, smurfing = 30, shell = 30
    - Bonus +15 for appearing in multiple distinct pattern types
    - Capped at 100

Ring risk score (0-100):
    - Average of member suspicion scores
    - Pattern severity weight applied
"""

from __future__ import annotations
from typing import Dict, List, Set


# Base scores per pattern type
PATTERN_BASE_SCORES: Dict[str, float] = {
    "cycle": 40.0,
    "smurfing": 30.0,
    "layered_shell": 30.0,
}

# Bonus for multi-pattern involvement
MULTI_PATTERN_BONUS = 15.0

# Pattern severity weights for ring scoring
RING_SEVERITY: Dict[str, float] = {
    "cycle": 1.2,
    "smurfing": 1.0,
    "layered_shell": 1.1,
}


def score_accounts(
    account_patterns: Dict[str, Set[str]],
    account_involvement_count: Dict[str, int],
) -> Dict[str, float]:
    """
    Compute suspicion scores for flagged accounts.

    Args:
        account_patterns: Mapping of account_id → set of pattern types
                          e.g. {"ACC_001": {"cycle", "smurfing"}}
        account_involvement_count: Mapping of account_id → number of rings involved in.

    Returns:
        Dict of account_id → suspicion_score (0-100).
    """
    scores: Dict[str, float] = {}

    for account_id, patterns in account_patterns.items():
        # Sum base scores for each pattern type
        base = sum(PATTERN_BASE_SCORES.get(p, 20.0) for p in patterns)

        # Scale by involvement count (diminishing returns)
        involvement = account_involvement_count.get(account_id, 1)
        if involvement > 1:
            base *= 1 + (involvement - 1) * 0.15  # 15% per extra involvement

        # Multi-pattern bonus
        if len(patterns) > 1:
            base += MULTI_PATTERN_BONUS

        # Cap at 100
        scores[account_id] = min(round(base, 1), 100.0)

    return scores


def score_ring(
    member_scores: List[float],
    pattern_type: str,
) -> float:
    """
    Compute risk score for a fraud ring.

    Args:
        member_scores: List of suspicion scores of ring members.
        pattern_type: The ring's pattern type (cycle, smurfing, layered_shell).

    Returns:
        Ring risk score (0-100).
    """
    if not member_scores:
        return 0.0

    avg = sum(member_scores) / len(member_scores)
    severity = RING_SEVERITY.get(pattern_type, 1.0)
    risk = avg * severity

    return min(round(risk, 1), 100.0)
