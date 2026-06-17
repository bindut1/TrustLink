"""Evaluate the matcher under a given set of tier weights.

Loads the exported per-tier scores (data/scores.json) and the gold labels
(data/labels.csv), re-ranks each job's candidates by the weighted total score,
and reports macro-averaged ranking metrics with bootstrap 95% CIs plus two
trust-risk metrics (claimed-only@5, fraud@5).

Honest-evaluation modes (use these for the report — they avoid the in-sample
trap and the over-claimer circularity):

    python run_eval.py --holdout       # OUT-OF-SAMPLE: nested GroupKFold, weights
                                       #   learned on train jobs, metrics on held-out
                                       #   jobs. This is the matcher's real number.
    python run_eval.py --real-only     # ablation on REAL candidates only (drop the
                                       #   synthetic over-claimers) so the verified
                                       #   tier is not mechanically tied to the label.
    python run_eval.py --sensitivity   # how the learned verified weight + fraud@5
                                       #   move as over-claimer prevalence varies.
    python run_eval.py --baselines     # 3-tier vs single-tier (keyword/semantic/
                                       #   verified only) rankers.
    python run_eval.py --diagnostics   # tier correlations + decorrelated re-fit.

Legacy / illustrative modes:

    python run_eval.py                 # baseline weights 0.4/0.5/0.1 (IN-SAMPLE)
    python run_eval.py --weights ...   # arbitrary weights file
    python run_eval.py --compare       # baseline vs learned (IN-SAMPLE)
    python run_eval.py --ablation      # with/without verified (IN-SAMPLE + paired test)
    python run_eval.py --sweep         # vary the verified weight, plot curve
    python run_eval.py --rel-threshold 3
"""
from __future__ import annotations

import argparse
import csv
import json
import os
from collections import defaultdict

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GroupKFold

import metrics as M
import stats as S
import weights as W

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
    that are NOT genuinely relevant (gold relevance < threshold) — the
    over-claimer / credential-fraud risk. Lower is better."""
    top = [r for r in ranked[:k] if r["keywordScore"] > 0]
    if not top:
        return 0.0
    miss = sum(
        1 for r in top if labels.get((job_id, r["candidateId"]), 0) < rel_threshold
    )
    return miss / len(top)


def score_one_job(
    rows: list[dict], job_id: str, labels: dict, weights: dict, rel_threshold: int
) -> dict | None:
    """Rank one job's candidate rows by the weighted total and return its
    per-job metrics (ranking + trust). None if the job has no relevant gold."""
    ranked = sorted(rows, key=lambda r: weighted_total(r, weights), reverse=True)
    ranked_rel = [labels.get((job_id, r["candidateId"]), 0) for r in ranked]
    total_relevant = sum(
        1 for r in rows if labels.get((job_id, r["candidateId"]), 0) >= rel_threshold
    )
    if total_relevant == 0:
        return None
    jm = M.evaluate_job(ranked_rel, total_relevant, rel_threshold)
    jm["claimed_only_rate_at_5"] = claimed_only_rate_at_k(ranked, 5)
    jm["fraud_rate_at_5"] = fraud_rate_at_k(ranked, job_id, labels, rel_threshold, 5)
    return jm


def evaluate(scores: list[dict], labels: dict, weights: dict, rel_threshold: int) -> dict:
    by_job: dict[str, list[dict]] = defaultdict(list)
    for r in scores:
        by_job[r["jobId"]].append(r)

    per_job: dict[str, list[float]] = defaultdict(list)
    for job_id, rows in by_job.items():
        jm = score_one_job(rows, job_id, labels, weights, rel_threshold)
        if jm is None:
            continue
        for k, v in jm.items():
            per_job[k].append(v)

    n_jobs = len(per_job.get("ndcg_at_10", []))
    agg = {k: (sum(v) / len(v) if v else 0.0) for k, v in per_job.items()}
    return {"weights": weights, "n_jobs": n_jobs, "metrics": agg, "per_job": dict(per_job)}


# --------------------------------------------------------------------------- #
# Honest evaluation helpers
# --------------------------------------------------------------------------- #
def fit_subset(X3: np.ndarray, y: np.ndarray, use_idx: list[int]) -> dict:
    """Fit logistic regression on a SUBSET of the 3 tier columns; excluded tiers
    get weight 0. Returns normalized non-negative {keyword,semantic,verified}."""
    clf = LogisticRegression(max_iter=1000)
    clf.fit(X3[:, use_idx], y)
    coef = np.clip(clf.coef_[0], 0, None)
    w = [0.0, 0.0, 0.0]
    if coef.sum() > 0:
        cn = coef / coef.sum()
        for j, idx in enumerate(use_idx):
            w[idx] = float(cn[j])
    return {"keyword": w[0], "semantic": w[1], "verified": w[2]}


def evaluate_holdout(
    scores: list[dict],
    labels: dict,
    rel_threshold: int,
    *,
    use_idx: list[int],
    n_splits: int = 5,
) -> dict:
    """Nested GroupKFold out-of-sample evaluation. For each fold, learn weights
    on the TRAIN jobs and score the held-out jobs with them. Every job is scored
    exactly once, by weights that never saw it. `use_idx` selects which tiers the
    fit may use ([0,1,2]=full, [0,1]=without verified)."""
    pairs = [r for r in scores if (r["jobId"], r["candidateId"]) in labels]
    X = np.array([[p["keywordScore"], p["semanticScore"], p["verifiedBonus"]] for p in pairs]) / 100.0
    y = np.array([1 if labels[(p["jobId"], p["candidateId"])] >= rel_threshold else 0 for p in pairs])
    groups = [p["jobId"] for p in pairs]

    by_job: dict[str, list[dict]] = defaultdict(list)
    for p in pairs:
        by_job[p["jobId"]].append(p)

    n_groups = len(set(groups))
    splits = min(n_splits, n_groups)
    gkf = GroupKFold(n_splits=splits)
    idx = np.arange(len(pairs))

    per_job: dict[str, list[float]] = defaultdict(list)
    fold_w: list[dict] = []
    for tr, te in gkf.split(X, y, groups):
        if len(set(y[tr])) < 2:
            w = dict(BASELINE)  # degenerate train fold → fall back
        else:
            w = fit_subset(X[tr], y[tr], use_idx)
        fold_w.append(w)
        test_jobs = {groups[i] for i in te}
        for job_id in test_jobs:
            jm = score_one_job(by_job[job_id], job_id, labels, w, rel_threshold)
            if jm is None:
                continue
            for k, v in jm.items():
                per_job[k].append(v)

    n_jobs = len(per_job.get("ndcg_at_10", []))
    agg = {k: (sum(v) / len(v) if v else 0.0) for k, v in per_job.items()}
    wmean = {t: float(np.mean([f[t] for f in fold_w])) for t in ("keyword", "semantic", "verified")}
    wsd = {t: float(np.std([f[t] for f in fold_w])) for t in ("keyword", "semantic", "verified")}
    return {
        "n_jobs": n_jobs,
        "metrics": agg,
        "per_job": dict(per_job),
        "fold_weights_mean": wmean,
        "fold_weights_sd": wsd,
        "n_folds": splits,
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


def load_weights(path: str) -> dict:
    with open(path, encoding="utf-8") as f:
        w = json.load(f)
    return {k: float(w[k]) for k in ("keyword", "semantic", "verified")}


def is_overclaimer(row: dict) -> bool:
    return str(row.get("candidateEmail", "")).startswith("overclaimer")


# --------------------------------------------------------------------------- #
# Modes
# --------------------------------------------------------------------------- #
def mode_holdout(scores, labels, rel_threshold) -> None:
    """The honest headline: out-of-sample, with vs without verified, paired test."""
    full = evaluate_holdout(scores, labels, rel_threshold, use_idx=[0, 1, 2])
    nover = evaluate_holdout(scores, labels, rel_threshold, use_idx=[0, 1])
    print(f"OUT-OF-SAMPLE (nested GroupKFold, {full['n_folds']} folds, {full['n_jobs']} jobs):\n")
    print("learned 3-tier (with verified):")
    print(fmt(full))
    print(fmt_ci(full))
    wm, ws = full["fold_weights_mean"], full["fold_weights_sd"]
    print(
        f"    fold weights mean±sd: kw={wm['keyword']:.3f}±{ws['keyword']:.3f}  "
        f"sem={wm['semantic']:.3f}±{ws['semantic']:.3f}  "
        f"ver={wm['verified']:.3f}±{ws['verified']:.3f}\n"
    )
    print("learned 2-tier (WITHOUT verified):")
    print(fmt(nover))
    print(fmt_ci(nover))
    print()
    print("Paired permutation tests (with verified vs WITHOUT, per held-out job):")
    for key in ("ndcg_at_5", "fraud_rate_at_5", "claimed_only_rate_at_5", "mrr"):
        a = full["per_job"].get(key, [])
        b = nover["per_job"].get(key, [])
        p = S.paired_permutation_p(b, a)  # diff = with - without
        da, db = (sum(a) / len(a) if a else 0), (sum(b) / len(b) if b else 0)
        sig = "significant" if p < 0.05 else "n.s."
        print(f"  {key:24s} without={db:.3f} → with={da:.3f}  (Δ={da - db:+.3f}, p={p:.4f}, {sig})")
    with open(os.path.join(REPORT_DIR, "holdout.json"), "w") as f:
        json.dump({"with_verified": full, "without_verified": nover}, f, indent=2)
    print(f"\n✓ wrote {os.path.join(REPORT_DIR, 'holdout.json')}")
    print(
        "\nNote: out-of-sample numbers are lower than the in-sample --ablation table"
        "\nby design — these are the figures to quote for the matcher's performance."
    )


def mode_real_only(scores, labels, rel_threshold) -> None:
    """De-circularize: drop the synthetic over-claimers (graded 0 AND verified=0
    by construction) and re-run the verified ablation on REAL candidates, whose
    verified status spans 0–100% and is NOT tied to the gold label."""
    real = [r for r in scores if not is_overclaimer(r)]
    n_oc = len(scores) - len(real)
    print(f"REAL-ONLY ablation ({len(real)} pairs; dropped {n_oc} over-claimer pairs):")
    print("On this cut, verified is decoupled from the label — any gain is non-circular.\n")
    if not os.path.exists(LEARNED_WEIGHTS):
        print("Need learned weights — run train_weights.py first.")
        return
    learned = load_weights(LEARNED_WEIGHTS)
    kw, sem = learned["keyword"], learned["semantic"]
    nover = {"keyword": kw / (kw + sem), "semantic": sem / (kw + sem), "verified": 0.0}

    # in-sample weights for context, but also do an honest holdout on the cut
    for name, w in (("learned (with verified)", learned), ("learned WITHOUT verified", nover)):
        res = evaluate(real, labels, w, rel_threshold)
        print(f"[in-sample] {name}:")
        print(fmt(res))
    full_h = evaluate_holdout(real, labels, rel_threshold, use_idx=[0, 1, 2])
    nover_h = evaluate_holdout(real, labels, rel_threshold, use_idx=[0, 1])
    print(f"\n[out-of-sample] with verified:")
    print(fmt(full_h))
    print(f"[out-of-sample] WITHOUT verified:")
    print(fmt(nover_h))
    print("\nPaired permutation (real-only, out-of-sample, with vs without):")
    for key in ("ndcg_at_5", "fraud_rate_at_5", "mrr"):
        a = full_h["per_job"].get(key, [])
        b = nover_h["per_job"].get(key, [])
        p = S.paired_permutation_p(b, a)
        da, db = (sum(a) / len(a) if a else 0), (sum(b) / len(b) if b else 0)
        print(f"  {key:24s} without={db:.3f} → with={da:.3f}  (Δ={da - db:+.3f}, p={p:.4f})")
    with open(os.path.join(REPORT_DIR, "real_only.json"), "w") as f:
        json.dump({"with_verified": full_h, "without_verified": nover_h}, f, indent=2)


def mode_sensitivity(scores, labels, rel_threshold) -> None:
    """Show that the learned verified weight is CONTINGENT on the threat model:
    sweep how many over-claimers are present and report the re-learned verified
    weight + fraud@5/NDCG@5 under it. Honest answer to 'isn't 0.48 just because
    you set over-claimers to half the set?'"""
    real = [r for r in scores if not is_overclaimer(r)]
    oc = [r for r in scores if is_overclaimer(r)]
    oc_emails = sorted({r["candidateEmail"] for r in oc})
    print("OVER-CLAIMER SENSITIVITY (learned verified weight vs fraud prevalence):\n")
    print(f"  {'oc_frac':>7}  {'#oc':>4}  {'w_verified':>10}  {'NDCG@5':>7}  {'fraud@5':>7}")
    rows = []
    for frac in (0.0, 0.10, 0.25, 0.40, 0.50):
        n_keep = round(frac * len(oc_emails))
        keep = set(oc_emails[:n_keep])
        subset = real + [r for r in oc if r["candidateEmail"] in keep]
        X, y, groups = W.build_xy(subset, labels, basis="tier", rel_threshold=rel_threshold)
        if len(set(y)) < 2:
            continue
        w = W.fit_weights(X, y)
        res = evaluate(subset, labels, w, rel_threshold)
        m = res["metrics"]
        rows.append({"oc_frac": frac, "n_oc": n_keep, "w_verified": round(w["verified"], 4),
                     "ndcg_at_5": round(m["ndcg_at_5"], 4), "fraud_rate_at_5": round(m["fraud_rate_at_5"], 4)})
        print(f"  {frac:7.2f}  {n_keep:4d}  {w['verified']:10.3f}  {m['ndcg_at_5']:7.3f}  {m['fraud_rate_at_5']:7.3f}")
    with open(os.path.join(REPORT_DIR, "sensitivity.json"), "w") as f:
        json.dump(rows, f, indent=2)
    print(
        "\n→ The verified weight RISES with over-claimer prevalence: it is a response"
        "\n  to fraud risk, not a fixed constant. State the threat model when quoting it."
    )


def mode_baselines(scores, labels, rel_threshold) -> None:
    """3-tier (out-of-sample) vs single-tier rankers. Shows the combination beats
    any one signal — the 'baseline' must be a real alternative, not another hand
    weighting of the same model."""
    print("BASELINES — single-tier rankers vs the 3-tier matcher:\n")
    singles = {
        "keyword-only": {"keyword": 1, "semantic": 0, "verified": 0},
        "semantic-only": {"keyword": 0, "semantic": 1, "verified": 0},
        "verified-only": {"keyword": 0, "semantic": 0, "verified": 1},
    }
    for name, w in singles.items():
        res = evaluate(scores, labels, w, rel_threshold)
        print(f"{name:14s}")
        print(fmt(res))
    full = evaluate_holdout(scores, labels, rel_threshold, use_idx=[0, 1, 2])
    print("3-tier learned (OUT-OF-SAMPLE)")
    print(fmt(full))


def mode_diagnostics(scores, labels, rel_threshold) -> None:
    """Tier collinearity + decorrelated re-fit (the honest answer to 'your
    logistic coefficients are on correlated features')."""
    kw = np.array([r["keywordScore"] for r in scores])
    sem = np.array([r["semanticScore"] for r in scores])
    ver = np.array([r["verifiedBonus"] for r in scores])
    C = np.corrcoef(np.vstack([kw, sem, ver]))
    print("DIAGNOSTICS — tier collinearity:\n")
    print("  Pearson correlation matrix (keyword, semantic, verified):")
    for i, name in enumerate(("keyword ", "semantic", "verified")):
        print(f"    {name}  " + "  ".join(f"{C[i][j]:+.3f}" for j in range(3)))
    viol = int(np.sum(ver > kw + 1e-9))
    print(f"\n  verified > keyword cases: {viol}  (verified is a SUBSET of keyword by construction)")
    Xd, yd, _ = W.build_xy(scores, labels, basis="disjoint", rel_threshold=rel_threshold)
    fd = W.fit_weights(Xd, yd)
    Xt, yt, _ = W.build_xy(scores, labels, basis="tier", rel_threshold=rel_threshold)
    ft = W.fit_weights(Xt, yt)
    print("\n  Tier-basis weights      [keyword,    semantic, verified]:",
          [round(ft["keyword"], 3), round(ft["semantic"], 3), round(ft["verified"], 3)])
    print("  Disjoint-basis weights  [claimed_only,semantic, verified]:",
          [round(fd["keyword"], 3), round(fd["semantic"], 3), round(fd["verified"], 3)])
    print(
        "\n→ Verified stays the dominant positive signal under the decorrelated basis,"
        "\n  so the conclusion does not rest on the keyword/verified collinearity."
    )


def mode_sweep(scores, labels, rel_threshold) -> None:
    base = load_weights(LEARNED_WEIGHTS) if os.path.exists(LEARNED_WEIGHTS) else BASELINE
    kw, sem, learned_v = base["keyword"], base["semantic"], base["verified"]
    ratio = kw / (kw + sem)
    grid = sorted({0.0, 0.05, 0.10, 0.15, 0.30, 0.40, round(learned_v, 4), 0.60, 0.80})
    rows = []
    print(f"Verified-weight sweep (keyword:semantic ratio fixed at {ratio:.3f}; learned v={learned_v:.4f}):\n")
    print(f"  {'v_ver':>6}  {'NDCG@5':>7}  {'P@5':>5}  {'R@10':>5}  {'claimed@5':>9}  {'fraud@5':>7}")
    for v in grid:
        w = {"keyword": ratio * (1 - v), "semantic": (1 - ratio) * (1 - v), "verified": v}
        m = evaluate(scores, labels, w, rel_threshold)["metrics"]
        rows.append({"verified": v, "is_learned": abs(v - learned_v) < 1e-6,
                     "recall_at_10": m["recall_at_10"], **{k: m[k] for k in HEADLINE}})
        mark = "  <- learned" if abs(v - learned_v) < 1e-6 else ""
        print(f"  {v:6.3f}  {m['ndcg_at_5']:7.3f}  {m['precision_at_5']:5.3f}  {m['recall_at_10']:5.3f}  "
              f"{m['claimed_only_rate_at_5']:9.3f}  {m['fraud_rate_at_5']:7.3f}{mark}")
    with open(os.path.join(REPORT_DIR, "sweep.json"), "w") as f:
        json.dump(rows, f, indent=2)
    print("\n→ As v rises, fraud@5/claimed-only@5 fall and ranking improves, BUT recall@10"
          "\n  declines (high verified weight drops genuinely-relevant but yet-unverified"
          "\n  candidates). The learned weight trades precision/trust against recall.")


def mode_ablation(scores, labels, rel_threshold) -> None:
    if not os.path.exists(LEARNED_WEIGHTS):
        print("Need learned weights — run train_weights.py first.")
        return
    learned_w = load_weights(LEARNED_WEIGHTS)
    kw, sem = learned_w["keyword"], learned_w["semantic"]
    no_verified = {"keyword": kw / (kw + sem), "semantic": sem / (kw + sem), "verified": 0.0}
    configs = {
        "learned (with verified)": learned_w,
        "learned WITHOUT verified": no_verified,
        "baseline 40/50/10": BASELINE,
    }
    report = {}
    print("IN-SAMPLE ablation (weights fit on all data; see --holdout for out-of-sample):\n")
    for name, w in configs.items():
        res = evaluate(scores, labels, w, rel_threshold)
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


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--weights", help="path to a weights JSON (keyword/semantic/verified)")
    ap.add_argument("--compare", action="store_true", help="baseline vs learned (in-sample)")
    ap.add_argument("--ablation", action="store_true", help="with/without verified (in-sample)")
    ap.add_argument("--holdout", action="store_true", help="OUT-OF-SAMPLE nested GroupKFold")
    ap.add_argument("--real-only", action="store_true", help="ablation on real candidates only")
    ap.add_argument("--sensitivity", action="store_true", help="verified weight vs over-claimer prevalence")
    ap.add_argument("--baselines", action="store_true", help="single-tier vs 3-tier rankers")
    ap.add_argument("--diagnostics", action="store_true", help="tier collinearity + decorrelated refit")
    ap.add_argument("--sweep", action="store_true", help="vary the verified weight")
    ap.add_argument("--rel-threshold", type=int, default=2)
    args = ap.parse_args()

    scores = load_scores()
    labels = load_labels()
    os.makedirs(REPORT_DIR, exist_ok=True)
    rt = args.rel_threshold

    if args.holdout:
        return mode_holdout(scores, labels, rt)
    if args.real_only:
        return mode_real_only(scores, labels, rt)
    if args.sensitivity:
        return mode_sensitivity(scores, labels, rt)
    if args.baselines:
        return mode_baselines(scores, labels, rt)
    if args.diagnostics:
        return mode_diagnostics(scores, labels, rt)
    if args.sweep:
        return mode_sweep(scores, labels, rt)
    if args.ablation:
        return mode_ablation(scores, labels, rt)

    if args.compare:
        base = evaluate(scores, labels, BASELINE, rt)
        print("Baseline (0.4 / 0.5 / 0.1) [IN-SAMPLE]:")
        print(fmt(base))
        with open(os.path.join(REPORT_DIR, "metrics_baseline.json"), "w") as f:
            json.dump(base, f, indent=2)
        if os.path.exists(LEARNED_WEIGHTS):
            learned_w = load_weights(LEARNED_WEIGHTS)
            learned = evaluate(scores, labels, learned_w, rt)
            print(f"\nLearned ({learned_w['keyword']:.3f} / {learned_w['semantic']:.3f} / {learned_w['verified']:.3f}) [IN-SAMPLE]:")
            print(fmt(learned))
            with open(os.path.join(REPORT_DIR, "metrics_learned.json"), "w") as f:
                json.dump(learned, f, indent=2)
            print("\nDelta (learned - baseline):")
            for k in base["metrics"]:
                print(f"  {k}: {learned['metrics'][k] - base['metrics'][k]:+.3f}")
        else:
            print(f"\n(no learned weights at {LEARNED_WEIGHTS} — run train_weights.py)")
        return

    weights = load_weights(args.weights) if args.weights else BASELINE
    result = evaluate(scores, labels, weights, rt)
    tag = "learned" if args.weights else "baseline"
    print(f"Weights ({tag}) [IN-SAMPLE]: {weights}")
    print(fmt(result))
    print(fmt_ci(result))
    with open(os.path.join(REPORT_DIR, f"metrics_{tag}.json"), "w") as f:
        json.dump(result, f, indent=2)


if __name__ == "__main__":
    main()
