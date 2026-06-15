"""Evaluate the matcher under a given set of tier weights.

Loads the exported per-tier scores (data/scores.json) and the gold labels
(data/labels.csv), re-ranks each job's candidates by the weighted total score,
and reports macro-averaged ranking metrics with bootstrap 95% CIs plus two
trust-risk metrics (claimed-only@5, fraud@5).

Usage:
    python run_eval.py                       # baseline weights 0.4/0.5/0.1
    python run_eval.py --weights ../../backend/config/match-weights.json
    python run_eval.py --compare             # baseline vs learned, side by side
    python run_eval.py --ablation            # with/without verified + paired test
    python run_eval.py --sweep               # vary the verified weight, plot curve
    python run_eval.py --rel-threshold 3     # stricter positives (recommended)
"""
from __future__ import annotations

import argparse
import csv
import json
import os
from collections import defaultdict

import metrics as M
import stats as S

HERE = os.path.dirname(os.path.abspath(__file__))
SCORES_PATH = os.path.join(HERE, "data", "scores.json")
LABELS_PATH = os.path.join(HERE, "data", "labels.csv")
REPORT_DIR = os.path.join(HERE, "report")
LEARNED_WEIGHTS = os.path.join(HERE, "..", "..", "backend", "config", "match-weights.json")

BASELINE = {"keyword": 0.4, "semantic": 0.5, "verified": 0.1}

# Metrics that get a bootstrap CI in the printed tables.
HEADLINE = ["ndcg_at_5", "precision_at_5", "claimed_only_rate_at_5", "fraud_rate_at_5"]


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
    """Of the top-k that match the job on skills (keywordScore>0), the fraction
    backed by self-CLAIMED skills only (no required skill verified on-chain).
    A risk-averse recruiter wants this LOW."""
    top = [r for r in ranked[:k] if r["keywordScore"] > 0]
    if not top:
        return 0.0
    return sum(1 for r in top if r["verifiedBonus"] == 0) / len(top)


def fraud_rate_at_k(
    ranked: list[dict], job_id: str, labels: dict, rel_threshold: int, k: int
) -> float:
    """Of the top-k that LOOK like a skill match (keywordScore>0), the fraction
    that are NOT genuinely relevant (gold relevance < threshold). This is the
    over-claimer / credential-fraud risk: candidates who gamed the keyword/
    semantic tiers without truly fitting the role. Verified-aware ranking should
    push these DOWN, so lower is better."""
    top = [r for r in ranked[:k] if r["keywordScore"] > 0]
    if not top:
        return 0.0
    miss = sum(
        1 for r in top if labels.get((job_id, r["candidateId"]), 0) < rel_threshold
    )
    return miss / len(top)


def evaluate(scores: list[dict], labels: dict, weights: dict, rel_threshold: int) -> dict:
    by_job: dict[str, list[dict]] = defaultdict(list)
    for r in scores:
        by_job[r["jobId"]].append(r)

    per_job: dict[str, list[float]] = defaultdict(list)
    for job_id, rows in by_job.items():
        ranked = sorted(rows, key=lambda r: weighted_total(r, weights), reverse=True)
        ranked_rel = [labels.get((job_id, r["candidateId"]), 0) for r in ranked]
        total_relevant = sum(
            1
            for (jid, _), rel in labels.items()
            if jid == job_id and rel >= rel_threshold
        )
        if total_relevant == 0:
            continue  # undefined recall/MRR
        jm = M.evaluate_job(ranked_rel, total_relevant, rel_threshold)
        for k, v in jm.items():
            per_job[k].append(v)
        per_job["claimed_only_rate_at_5"].append(claimed_only_rate_at_k(ranked, 5))
        per_job["fraud_rate_at_5"].append(
            fraud_rate_at_k(ranked, job_id, labels, rel_threshold, 5)
        )

    n_jobs = len(per_job.get("ndcg_at_10", []))
    agg = {k: (sum(v) / len(v) if v else 0.0) for k, v in per_job.items()}
    return {
        "weights": weights,
        "n_jobs": n_jobs,
        "metrics": agg,
        "per_job": dict(per_job),
    }


def fmt(result: dict) -> str:
    m = result["metrics"]
    return (
        f"  P@5={m['precision_at_5']:.3f}  R@10={m['recall_at_10']:.3f}  "
        f"NDCG@5={m['ndcg_at_5']:.3f}  NDCG@10={m['ndcg_at_10']:.3f}  MRR={m['mrr']:.3f}  "
        f"claimed-only@5={m['claimed_only_rate_at_5']:.3f}  "
        f"fraud@5={m['fraud_rate_at_5']:.3f}  (over {result['n_jobs']} jobs)"
    )


def fmt_ci(result: dict) -> str:
    """Headline metrics with bootstrap 95% CIs (the version for the thesis table)."""
    lines = []
    for key in HEADLINE:
        vals = result["per_job"].get(key, [])
        mean, lo, hi = S.bootstrap_ci(vals)
        lines.append(f"    {key:24s} {mean:.3f}  [95% CI {lo:.3f}, {hi:.3f}]")
    return "\n".join(lines)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--weights", help="path to a weights JSON (keyword/semantic/verified)")
    ap.add_argument("--compare", action="store_true", help="baseline vs learned weights")
    ap.add_argument(
        "--ablation",
        action="store_true",
        help="learned vs learned-without-verified vs baseline (trust-signal ablation)",
    )
    ap.add_argument(
        "--sweep",
        action="store_true",
        help="vary the verified weight and report the trade-off curve",
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

    if args.sweep:
        # How does the verified weight magnitude trade relevance vs trust risk?
        # Keep the learned keyword:semantic RATIO fixed; vary only the verified
        # share v in [0,1], renormalizing the other two to (1 - v).
        base = load_weights(LEARNED_WEIGHTS) if os.path.exists(LEARNED_WEIGHTS) else BASELINE
        kw, sem = base["keyword"], base["semantic"]
        ratio = kw / (kw + sem)
        grid = [0.0, 0.05, 0.10, 0.15, 0.2252, 0.30, 0.40, 0.60, 0.80]
        rows = []
        print(f"Verified-weight sweep (keyword:semantic ratio fixed at {ratio:.3f}):\n")
        print(
            f"  {'v_ver':>6}  {'NDCG@5':>7}  {'P@5':>5}  "
            f"{'claimed@5':>9}  {'fraud@5':>7}"
        )
        for v in grid:
            w = {"keyword": ratio * (1 - v), "semantic": (1 - ratio) * (1 - v), "verified": v}
            res = evaluate(scores, labels, w, args.rel_threshold)
            m = res["metrics"]
            rows.append({"verified": v, **{k: m[k] for k in HEADLINE}})
            print(
                f"  {v:6.3f}  {m['ndcg_at_5']:7.3f}  {m['precision_at_5']:5.3f}  "
                f"{m['claimed_only_rate_at_5']:9.3f}  {m['fraud_rate_at_5']:7.3f}"
            )
        with open(os.path.join(REPORT_DIR, "sweep.json"), "w") as f:
            json.dump(rows, f, indent=2)
        print(
            "\n→ Read off the operating point: fraud@5/claimed-only@5 fall as v rises,"
            "\n  while relevance (NDCG@5/P@5) holds then degrades once v crowds out"
            "\n  the semantic tier — justifying the learned magnitude, not just its sign."
        )
        return

    if args.ablation:
        if not os.path.exists(LEARNED_WEIGHTS):
            print(f"Need learned weights at {LEARNED_WEIGHTS} — run train_weights.py first.")
            return
        learned_w = load_weights(LEARNED_WEIGHTS)
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
            print(fmt_ci(res))
            print()
        with open(os.path.join(REPORT_DIR, "ablation.json"), "w") as f:
            json.dump(report, f, indent=2)

        full = report["learned (with verified)"]
        ablated = report["learned WITHOUT verified"]
        print("Paired tests (with verified vs WITHOUT verified, per job):")
        for key in ("fraud_rate_at_5", "claimed_only_rate_at_5", "ndcg_at_5"):
            a = full["per_job"].get(key, [])
            b = ablated["per_job"].get(key, [])
            p = S.paired_permutation_p(a, b)
            da = sum(a) / len(a) if a else 0.0
            db = sum(b) / len(b) if b else 0.0
            sig = "significant" if p < 0.05 else "n.s."
            print(f"  {key:24s} {da:.3f} → {db:.3f}  (Δ={db - da:+.3f}, p={p:.4f}, {sig})")
        print(
            "\nInterpretation: verified-aware matching should DROP fraud@5/claimed-only@5"
            "\n(significantly) while NDCG@5 stays within its CI — proven candidates surface"
            "\nfirst without sacrificing relevance."
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
    print(fmt_ci(result))
    with open(os.path.join(REPORT_DIR, f"metrics_{tag}.json"), "w") as f:
        json.dump(result, f, indent=2)


if __name__ == "__main__":
    main()
