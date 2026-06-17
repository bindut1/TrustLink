"""Learn the 3-tier matching weights from the gold labels (replaces 40/50/10).

Trains a Logistic Regression on per-tier scores -> relevance, then turns the
fitted coefficients into non-negative weights that sum to 1 and writes them to
backend/config/match-weights.json (consumed by MatchingWeightsService).

Why Logistic Regression: its coefficients ARE interpretable tier weights that
drop straight into the existing linear score — no model serving at runtime, and
fully explainable for the defense ("the data says ...").

IMPORTANT — what these weights are and are NOT:
  * They are fit on ALL labelled pairs (this is correct for *deployment*: you
    ship weights trained on everything you have).
  * They are therefore IN-SAMPLE and MUST NOT be quoted as the matcher's
    performance. The honest, out-of-sample ranking numbers come from
    `run_eval.py --holdout` (nested GroupKFold), which re-fits per fold.
  * keyword and verified are collinear by construction (verified ⊆ keyword), so
    the tier-basis magnitudes are regularization-sensitive. A decorrelated
    "disjoint-basis" fit (claimed_only vs verified) is printed as a robustness
    check — see weights.py.

Validation uses GroupKFold by job_id so a job's candidates never span train/test.

Usage:
    python train_weights.py
"""
from __future__ import annotations

import csv
import json
import os

import weights as W

HERE = os.path.dirname(os.path.abspath(__file__))
SCORES_PATH = os.path.join(HERE, "data", "scores.json")
LABELS_PATH = os.path.join(HERE, "data", "labels.csv")
OUT_PATH = os.environ.get(
    "MATCH_WEIGHTS_OUT",
    os.path.join(HERE, "..", "..", "backend", "config", "match-weights.json"),
)


def load() -> tuple[list[dict], dict[tuple[str, str], int]]:
    with open(SCORES_PATH, encoding="utf-8") as f:
        scores = json.load(f)
    labels: dict[tuple[str, str], int] = {}
    with open(LABELS_PATH, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            labels[(row["job_id"], row["candidate_id"])] = int(row["relevance"])
    return scores, labels


def main() -> None:
    if not os.path.exists(SCORES_PATH) or not os.path.exists(LABELS_PATH):
        raise SystemExit("Run `npm run export:scores` and bootstrap_labels.py first.")

    scores, labels = load()

    # --- tier basis: the deployed [keyword, semantic, verified] weights ---
    X, y, groups = W.build_xy(scores, labels, basis="tier")
    print(f"Training examples: {len(y)}  (positives: {int(y.sum())})")
    if len(set(y)) < 2:
        raise SystemExit("Labels have only one class — cannot train.")

    cv_auc = W.groupkfold_auc(X, y, groups)
    fit = W.fit_weights(X, y)
    coef = fit["raw"]
    print(f"Raw coefficients (kw, sem, ver): {coef}")

    # --- disjoint basis: decorrelated robustness check ---
    Xd, yd, _ = W.build_xy(scores, labels, basis="disjoint")
    fit_d = W.fit_weights(Xd, yd)
    print(
        "Disjoint-basis check (claimed_only, semantic, verified): "
        f"weights={[round(fit_d['keyword'],4), round(fit_d['semantic'],4), round(fit_d['verified'],4)]} "
        f"raw={fit_d['raw']}"
    )

    out = {
        "keyword": round(fit["keyword"], 4),
        "semantic": round(fit["semantic"], 4),
        "verified": round(fit["verified"], 4),
        "modelVersion": "logreg-v1",
        "cvMetrics": {"roc_auc_groupkfold": round(cv_auc, 4)},
        "rawCoefficients": coef,
        "collinearity": {
            "note": (
                "keyword and verified are positively correlated by construction "
                "(verified skills are a subset of matched required skills); "
                "tier-basis magnitudes are regularization-sensitive."
            ),
            "disjointBasisWeights": {
                "claimed_only": round(fit_d["keyword"], 4),
                "semantic": round(fit_d["semantic"], 4),
                "verified": round(fit_d["verified"], 4),
            },
        },
        "note": "Learned by ai-service/evaluation/train_weights.py (Logistic Regression). "
        "IN-SAMPLE fit for deployment; quote run_eval.py --holdout for performance.",
    }
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)

    print(f"\n✓ Wrote learned weights to {OUT_PATH}")
    print(
        f"  keyword={out['keyword']}  semantic={out['semantic']}  verified={out['verified']}"
    )
    print(f"  CV ROC-AUC (GroupKFold): {out['cvMetrics']['roc_auc_groupkfold']}")
    print("  → Performance numbers: run `python run_eval.py --holdout` (out-of-sample).")


if __name__ == "__main__":
    main()
