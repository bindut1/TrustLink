"""Ranking metrics for evaluating the job<->candidate matcher.

All functions operate on a single ranked list (one job's candidates sorted by
predicted score, best first) expressed as that list's *graded relevance labels*.
Graded relevance is an int in {0,1,2,3}; for the binary metrics a candidate
counts as relevant when its relevance >= `rel_threshold`.

Macro-averaging (mean over jobs) is done in `aggregate`.
"""
from __future__ import annotations

import math
from typing import Sequence


def precision_at_k(ranked_rel: Sequence[int], k: int, rel_threshold: int = 2) -> float:
    top = ranked_rel[:k]
    if not top:
        return 0.0
    hits = sum(1 for r in top if r >= rel_threshold)
    return hits / min(k, len(top))


def recall_at_k(
    ranked_rel: Sequence[int],
    total_relevant: int,
    k: int,
    rel_threshold: int = 2,
) -> float:
    if total_relevant == 0:
        return 0.0
    hits = sum(1 for r in ranked_rel[:k] if r >= rel_threshold)
    return hits / total_relevant


def _dcg(ranked_rel: Sequence[int], k: int) -> float:
    dcg = 0.0
    for i, rel in enumerate(ranked_rel[:k]):
        # standard gain 2^rel - 1, log2(i+2) discount
        dcg += (2 ** rel - 1) / math.log2(i + 2)
    return dcg


def ndcg_at_k(ranked_rel: Sequence[int], k: int) -> float:
    ideal = sorted(ranked_rel, reverse=True)
    idcg = _dcg(ideal, k)
    if idcg == 0:
        return 0.0
    return _dcg(ranked_rel, k) / idcg


def reciprocal_rank(ranked_rel: Sequence[int], rel_threshold: int = 2) -> float:
    for i, rel in enumerate(ranked_rel):
        if rel >= rel_threshold:
            return 1.0 / (i + 1)
    return 0.0


def evaluate_job(
    ranked_rel: Sequence[int],
    total_relevant: int,
    rel_threshold: int = 2,
) -> dict[str, float]:
    """Compute all four metrics for one job's ranked candidate list."""
    return {
        "precision_at_5": precision_at_k(ranked_rel, 5, rel_threshold),
        "recall_at_10": recall_at_k(ranked_rel, total_relevant, 10, rel_threshold),
        "ndcg_at_10": ndcg_at_k(ranked_rel, 10),
        "mrr": reciprocal_rank(ranked_rel, rel_threshold),
    }


def aggregate(per_job: list[dict[str, float]]) -> dict[str, float]:
    """Macro-average each metric across jobs (ignores jobs with no relevant)."""
    if not per_job:
        return {}
    keys = per_job[0].keys()
    return {k: sum(j[k] for j in per_job) / len(per_job) for k in keys}
