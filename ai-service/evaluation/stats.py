"""Lightweight, dependency-free statistics for the matching evaluation.

The eval set is small (tens of jobs), so the thesis needs uncertainty around
each metric and a paired test between configurations — otherwise a difference
like NDCG 0.992 vs 0.993 is indistinguishable from noise. These helpers use only
the standard library (random) so the harness stays runnable anywhere.

- bootstrap_ci: percentile bootstrap 95% CI for the mean of per-job values.
- paired_permutation_p: two-sided sign-flip permutation test on paired per-job
  differences (H0: mean difference = 0). Exact when 2**n <= max_exact, else
  Monte-Carlo with `iters` random sign flips.
"""
from __future__ import annotations

import itertools
import random
from typing import Sequence


def bootstrap_ci(
    values: Sequence[float],
    *,
    confidence: float = 0.95,
    iters: int = 2000,
    seed: int = 12345,
) -> tuple[float, float, float]:
    """Return (mean, lo, hi) where [lo, hi] is the percentile bootstrap CI."""
    n = len(values)
    if n == 0:
        return (0.0, 0.0, 0.0)
    mean = sum(values) / n
    if n == 1:
        return (mean, mean, mean)
    rng = random.Random(seed)
    means = []
    for _ in range(iters):
        sample = [values[rng.randrange(n)] for _ in range(n)]
        means.append(sum(sample) / n)
    means.sort()
    alpha = (1 - confidence) / 2
    lo = means[int(alpha * iters)]
    hi = means[min(iters - 1, int((1 - alpha) * iters))]
    return (mean, lo, hi)


def paired_permutation_p(
    a: Sequence[float],
    b: Sequence[float],
    *,
    iters: int = 20000,
    max_exact: int = 18,
    seed: int = 12345,
) -> float:
    """Two-sided paired sign-flip permutation test on differences d = b - a.

    Tests whether the mean paired difference is distinguishable from 0. Returns a
    p-value. Exact enumeration when n <= max_exact, otherwise Monte-Carlo.
    """
    diffs = [bi - ai for ai, bi in zip(a, b)]
    n = len(diffs)
    if n == 0:
        return 1.0
    observed = abs(sum(diffs) / n)
    # nonzero diffs only contribute to sign flips; zeros never change the sum
    nz = [d for d in diffs if d != 0]
    if not nz:
        return 1.0

    extreme = 0
    total = 0
    if len(nz) <= max_exact:
        for signs in itertools.product((1, -1), repeat=len(nz)):
            s = sum(sign * d for sign, d in zip(signs, nz))
            if abs(s / n) >= observed - 1e-12:
                extreme += 1
            total += 1
    else:
        rng = random.Random(seed)
        for _ in range(iters):
            s = sum((1 if rng.random() < 0.5 else -1) * d for d in nz)
            if abs(s / n) >= observed - 1e-12:
                extreme += 1
            total += 1
    return extreme / total
