"""Shared weight-learning helpers for the matching evaluation.

Centralizes the Logistic-Regression fit so that training (train_weights.py) and
the out-of-sample / sensitivity / diagnostics modes in run_eval.py agree on
exactly one definition of "learned weights". Keeping it here also lets the
honest, held-out protocols re-fit per fold without duplicating code.

Two feature bases are supported:

  * "tier"      = the raw scoring tiers [keyword, semantic, verified]. These are
                  what the deployed linear score uses and what the UI shows, but
                  verified is mechanically nested inside keyword (a verified
                  required skill is also a matched required skill), so the two
                  are positively correlated by construction.
  * "disjoint"  = [claimed_only, semantic, verified] where
                  claimed_only = keyword - verified. This PARTITIONS the matched
                  required skills into "self-declared but unverified" vs
                  "verified on-chain", removing the nesting so the regression
                  coefficients are not inflated/deflated by collinearity. Used
                  as a robustness check on the tier-basis weights.
"""
from __future__ import annotations

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GroupKFold
from sklearn.metrics import roc_auc_score

REL_THRESHOLD = 2  # relevance >= 2 counts as a positive (relevant) example


def _row_features(r: dict, basis: str) -> list[float]:
    kw, sem, ver = r["keywordScore"], r["semanticScore"], r["verifiedBonus"]
    if basis == "disjoint":
        claimed_only = max(0.0, kw - ver)
        return [claimed_only / 100.0, sem / 100.0, ver / 100.0]
    return [kw / 100.0, sem / 100.0, ver / 100.0]


def build_xy(
    scores: list[dict],
    labels: dict[tuple[str, str], int],
    *,
    rel_threshold: int = REL_THRESHOLD,
    basis: str = "tier",
) -> tuple[np.ndarray, np.ndarray, list[str]]:
    X, y, groups = [], [], []
    for r in scores:
        key = (r["jobId"], r["candidateId"])
        if key not in labels:
            continue
        X.append(_row_features(r, basis))
        y.append(1 if labels[key] >= rel_threshold else 0)
        groups.append(r["jobId"])
    return np.array(X), np.array(y), groups


def fit_weights(X: np.ndarray, y: np.ndarray, *, C: float = 1.0) -> dict:
    """Fit logistic regression, clip negative coefficients to 0, normalize to
    sum=1. Returns the three weights plus the raw coefficients.

    Negative clipping encodes "a tier must not actively lower a candidate's
    score"; it is a modelling choice, not something the data forces, so the raw
    (possibly negative) coefficients are returned alongside for transparency.
    """
    clf = LogisticRegression(max_iter=1000, C=C)
    clf.fit(X, y)
    coef = clf.coef_[0]
    clipped = np.clip(coef, 0, None)
    if clipped.sum() == 0:
        # degenerate: no tier positively predicts relevance — fall back to equal
        weights = np.array([1 / 3, 1 / 3, 1 / 3])
    else:
        weights = clipped / clipped.sum()
    return {
        "keyword": float(weights[0]),
        "semantic": float(weights[1]),
        "verified": float(weights[2]),
        "raw": coef.round(4).tolist(),
    }


def groupkfold_auc(
    X: np.ndarray, y: np.ndarray, groups: list[str], *, C: float = 1.0
) -> float:
    n_groups = len(set(groups))
    n_splits = min(5, n_groups)
    if n_splits < 2:
        return float("nan")
    gkf = GroupKFold(n_splits=n_splits)
    aucs = []
    for tr, te in gkf.split(X, y, groups):
        if len(set(y[tr])) < 2 or len(set(y[te])) < 2:
            continue
        clf = LogisticRegression(max_iter=1000, C=C)
        clf.fit(X[tr], y[tr])
        prob = clf.predict_proba(X[te])[:, 1]
        aucs.append(roc_auc_score(y[te], prob))
    return float(np.mean(aucs)) if aucs else float("nan")
