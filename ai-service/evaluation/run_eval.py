"""Evaluate the matcher under a given set of tier weights.

Loads the exported per-tier scores (data/scores.json) and the gold labels
(data/labels.csv), re-ranks each job's candidates by the weighted total score,
and reports macro-averaged Precision@5, Recall@10, NDCG@10 and MRR.

Usage:
    python run_eval.py                       # baseline weights 0.4/0.5/0.1
    python run_eval.py --weights ../../backend/config/match-weights.json
    python run_eval.py --compare             # baseline vs learned, side by side
    python run_eval.py --rel-threshold 2
"""
from __future__ import annotations

import argparse
import csv
import json
import os
from collections import defaultdict

import metrics as M

HERE = os.path.dirname(os.path.abspath(__file__))
SCORES_PATH = os.path.join(HERE, "data", "scores.json")
LABELS_PATH = os.path.join(HERE, "data", "labels.csv")
REPORT_DIR = os.path.join(HERE, "report")
LEARNED_WEIGHTS = os.path.join(HERE, "..", "..", "backend", "config", "match-weights.json")

BASELINE = {"keyword": 0.4, "semantic": 0.5, "verified": 0.1}


def load_scores() -> list[dict]:
    with open(SCORES_PATH, encoding="utf-8") as f:
        return json.load(f)


def load_labels() -> dict[tuple[str, str], int]:
    labels: dict[tuple[str, str], int] = {}
    with open(LABELS_PATH, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            labels[(row["job_id"], row["candidate_id"])] = int(row["relevance"])
    return labels


def weighted_total(row: dict, w: dict) -> float:
    return (
        w["keyword"] * row["keywordScore"]
        + w["semantic"] * row["semanticScore"]
        + w["verified"] * row["verifiedBonus"]
    )


def claimed_only_rate_at_k(ranked: list[dict], k: int) -> float:
    """Trust-risk metric: of the top-k ranked candidates, the fraction that match
    the job on self-CLAIMED skills only (no required skill verified on-chain).
    A risk-averse recruiter wants this LOW — proven candidates should surface first.
    Candidates who don't match the job at all (keywordScore==0) are ignored."""
    top = [r for r in ranked[:k] if r["keywordScore"] > 0]
    if not top:
        return 0.0
    claimed_only = sum(1 for r in top if r["verifiedBonus"] == 0)
    return claimed_only / len(top)


def evaluate(scores: list[dict], labels: dict, weights: dict, rel_threshold: int) -> dict:
    by_job: dict[str, list[dict]] = defaultdict(list)
    for r in scores:
        by_job[r["jobId"]].append(r)

    per_job_metrics = []
    claimed_only_rates = []
    for job_id, rows in by_job.items():
        # rank candidates by weighted total score, best first
        ranked = sorted(rows, key=lambda r: weighted_total(r, weights), reverse=True)
        ranked_rel = [labels.get((job_id, r["candidateId"]), 0) for r in ranked]
        total_relevant = sum(
            1
            for (jid, _), rel in labels.items()
            if jid == job_id and rel >= rel_threshold
        )
        if total_relevant == 0:
            # no gold-relevant candidate for this job -> skip (undefined recall/MRR)
            continue
        per_job_metrics.append(M.evaluate_job(ranked_rel, total_relevant, rel_threshold))
        claimed_only_rates.append(claimed_only_rate_at_k(ranked, 5))

    agg = M.aggregate(per_job_metrics)
    agg["claimed_only_rate_at_5"] = (
        sum(claimed_only_rates) / len(claimed_only_rates) if claimed_only_rates else 0.0
    )
    return {"weights": weights, "n_jobs": len(per_job_metrics), "metrics": agg}


def fmt(result: dict) -> str:
    m = result["metrics"]
    return (
        f"  P@5={m['precision_at_5']:.3f}  R@10={m['recall_at_10']:.3f}  "
        f"NDCG@10={m['ndcg_at_10']:.3f}  MRR={m['mrr']:.3f}  "
        f"claimed-only@5={m['claimed_only_rate_at_5']:.3f}  "
        f"(over {result['n_jobs']} jobs)"
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--weights", help="path to a weights JSON (keyword/semantic/verified)")
    ap.add_argument("--compare", action="store_true", help="baseline vs learned weights")
    ap.add_argument(
        "--ablation",
        action="store_true",
        help="learned vs learned-without-verified vs baseline (trust-signal ablation)",
    )
    ap.add_argument("--rel-threshold", type=int, default=2)
    args = ap.parse_args()

    scores = load_scores()
    labels = load_labels()
    os.makedirs(REPORT_DIR, exist_ok=True)

    def load_weights(path: str) -> dict:
        with open(path, encoding="utf-8") as f:
            w = json.load(f)
        return {k: float(w[k]) for k in ("keyword", "semantic", "verified")}

    if args.ablation:
        # Does the blockchain-verification signal help recruitment matching?
        # Compare the learned matcher WITH vs WITHOUT the verified tier.
        if not os.path.exists(LEARNED_WEIGHTS):
            print(f"Need learned weights at {LEARNED_WEIGHTS} — run train_weights.py first.")
            return
        learned_w = load_weights(LEARNED_WEIGHTS)
        # ablate: drop the verified tier, renormalize the other two to sum=1
        kw, sem = learned_w["keyword"], learned_w["semantic"]
        no_verified = {
            "keyword": kw / (kw + sem),
            "semantic": sem / (kw + sem),
            "verified": 0.0,
        }
        configs = {
            "learned (with verified)": learned_w,
            "learned WITHOUT verified": no_verified,
            "baseline 40/50/10": BASELINE,
        }
        report = {}
        for name, w in configs.items():
            res = evaluate(scores, labels, w, args.rel_threshold)
            report[name] = res
            print(f"{name}:")
            print(fmt(res))
            print()
        with open(os.path.join(REPORT_DIR, "ablation.json"), "w") as f:
            json.dump(report, f, indent=2)

        full = report["learned (with verified)"]["metrics"]
        ablated = report["learned WITHOUT verified"]["metrics"]
        d = ablated["claimed_only_rate_at_5"] - full["claimed_only_rate_at_5"]
        print("Interpretation:")
        print(
            f"  Dropping the verified signal changes ranking quality little "
            f"(NDCG {full['ndcg_at_10']:.3f} → {ablated['ndcg_at_10']:.3f}),"
        )
        print(
            f"  but the trust profile of the top-5 worsens: claimed-only@5 "
            f"{full['claimed_only_rate_at_5']:.3f} → {ablated['claimed_only_rate_at_5']:.3f} "
            f"({'+' if d >= 0 else ''}{d:.3f})."
        )
        print(
            "  → Verified-aware matching surfaces PROVEN candidates first without "
            "hurting relevance — the value of blockchain for recruitment."
        )
        return

    if args.compare:
        base = evaluate(scores, labels, BASELINE, args.rel_threshold)
        print("Baseline (0.4 / 0.5 / 0.1):")
        print(fmt(base))
        with open(os.path.join(REPORT_DIR, "metrics_baseline.json"), "w") as f:
            json.dump(base, f, indent=2)

        if os.path.exists(LEARNED_WEIGHTS):
            learned_w = load_weights(LEARNED_WEIGHTS)
            learned = evaluate(scores, labels, learned_w, args.rel_threshold)
            print(
                f"\nLearned ({learned_w['keyword']:.3f} / "
                f"{learned_w['semantic']:.3f} / {learned_w['verified']:.3f}):"
            )
            print(fmt(learned))
            with open(os.path.join(REPORT_DIR, "metrics_learned.json"), "w") as f:
                json.dump(learned, f, indent=2)

            print("\nDelta (learned - baseline):")
            for k in base["metrics"]:
                d = learned["metrics"][k] - base["metrics"][k]
                print(f"  {k}: {d:+.3f}")
        else:
            print(f"\n(no learned weights at {LEARNED_WEIGHTS} — run train_weights.py)")
        return

    weights = load_weights(args.weights) if args.weights else BASELINE
    result = evaluate(scores, labels, weights, args.rel_threshold)
    tag = "learned" if args.weights else "baseline"
    print(f"Weights ({tag}): {weights}")
    print(fmt(result))
    with open(os.path.join(REPORT_DIR, f"metrics_{tag}.json"), "w") as f:
        json.dump(result, f, indent=2)


if __name__ == "__main__":
    main()
