"""Learn the 3-tier matching weights from the gold labels (replaces 40/50/10).

Trains a Logistic Regression on per-tier scores -> relevance, then turns the
fitted coefficients into non-negative weights that sum to 1 and writes them to
backend/config/match-weights.json (consumed by MatchingWeightsService).

Why Logistic Regression: its coefficients ARE interpretable tier weights that
drop straight into the existing linear score — no model serving at runtime, and
fully explainable for the defense ("the data says semantic matters most, ...").

Validation uses GroupKFold by job_id so a job's candidates never span train/test.

Usage:
    python train_weights.py
"""
from __future__ import annotations

import csv
import json
import os

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GroupKFold
from sklearn.metrics import roc_auc_score

HERE = os.path.dirname(os.path.abspath(__file__))
SCORES_PATH = os.path.join(HERE, "data", "scores.json")
LABELS_PATH = os.path.join(HERE, "data", "labels.csv")
OUT_PATH = os.environ.get(
    "MATCH_WEIGHTS_OUT",
    os.path.join(HERE, "..", "..", "backend", "config", "match-weights.json"),
)

REL_THRESHOLD = 2  # relevance >= 2 counts as a positive (relevant) example
TIERS = ["keywordScore", "semanticScore", "verifiedBonus"]


def load() -> tuple[np.ndarray, np.ndarray, list[str]]:
    with open(SCORES_PATH, encoding="utf-8") as f:
        scores = json.load(f)
    labels: dict[tuple[str, str], int] = {}
    with open(LABELS_PATH, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            labels[(row["job_id"], row["candidate_id"])] = int(row["relevance"])

    X, y, groups = [], [], []
    for r in scores:
        key = (r["jobId"], r["candidateId"])
        if key not in labels:
            continue
        X.append([r[t] / 100.0 for t in TIERS])
        y.append(1 if labels[key] >= REL_THRESHOLD else 0)
        groups.append(r["jobId"])
    return np.array(X), np.array(y), groups


def cross_val_auc(X: np.ndarray, y: np.ndarray, groups: list[str]) -> float:
    n_groups = len(set(groups))
    n_splits = min(5, n_groups)
    if n_splits < 2:
        return float("nan")
    gkf = GroupKFold(n_splits=n_splits)
    aucs = []
    for train_idx, test_idx in gkf.split(X, y, groups):
        if len(set(y[train_idx])) < 2 or len(set(y[test_idx])) < 2:
            continue
        clf = LogisticRegression(max_iter=1000)
        clf.fit(X[train_idx], y[train_idx])
        prob = clf.predict_proba(X[test_idx])[:, 1]
        aucs.append(roc_auc_score(y[test_idx], prob))
    return float(np.mean(aucs)) if aucs else float("nan")


def main() -> None:
    if not os.path.exists(SCORES_PATH) or not os.path.exists(LABELS_PATH):
        raise SystemExit("Run `npm run export:scores` and bootstrap_labels.py first.")

    X, y, groups = load()
    print(f"Training examples: {len(y)}  (positives: {int(y.sum())})")
    if len(set(y)) < 2:
        raise SystemExit("Labels have only one class — cannot train.")

    cv_auc = cross_val_auc(X, y, groups)

    # final fit on all data for the deployed coefficients
    clf = LogisticRegression(max_iter=1000)
    clf.fit(X, y)
    coef = clf.coef_[0]
    print(f"Raw coefficients (kw, sem, ver): {coef.round(3).tolist()}")

    # clip negatives (a tier shouldn't *hurt* the score) then normalize to sum=1
    clipped = np.clip(coef, 0, None)
    if clipped.sum() == 0:
        raise SystemExit("All coefficients <= 0 — labels not separable by tiers.")
    weights = clipped / clipped.sum()

    out = {
        "keyword": round(float(weights[0]), 4),
        "semantic": round(float(weights[1]), 4),
        "verified": round(float(weights[2]), 4),
        "modelVersion": "logreg-v1",
        "cvMetrics": {"roc_auc_groupkfold": round(cv_auc, 4)},
        "rawCoefficients": coef.round(4).tolist(),
        "note": "Learned by ai-service/evaluation/train_weights.py (Logistic Regression).",
    }
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)

    print(f"\n✓ Wrote learned weights to {OUT_PATH}")
    print(f"  keyword={out['keyword']}  semantic={out['semantic']}  verified={out['verified']}")
    print(f"  CV ROC-AUC (GroupKFold): {out['cvMetrics']['roc_auc_groupkfold']}")
    if coef[2] <= 0:
        print(
            "⚠ verified coefficient <= 0: on this label set, verified skills did not "
            "independently predict relevance. Discuss in the report."
        )


if __name__ == "__main__":
    main()
