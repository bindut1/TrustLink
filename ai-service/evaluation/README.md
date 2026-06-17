# Matching Evaluation Harness

Offline evaluation of TrustLink's 3-tier job↔candidate matcher. Produces the
ranking metrics (Precision@5, Recall@10, NDCG@10, MRR) used to answer two
defense questions: *"how is the matcher measured?"* and *"where do the tier
weights come from?"*

## Pipeline

```
backend `npm run export:scores`  ->  data/scores.json   (every job×candidate, raw per-tier scores 0–100)
bootstrap_labels.py + manual edit ->  data/labels.csv    (gold graded relevance 0–3)
train_weights.py                  ->  backend/config/match-weights.json  (learned weights)
run_eval.py [--compare]           ->  report/metrics_*.json + console table
```

## Steps

1. **Seed + build embeddings + export scores** (from `backend/`):
   ```bash
   # SEED_DEMO=true seeds jobs + candidate_skills + simulated credentials (the
   # eval set); default seed is accounts-only. SEED_VERIFY_FRACTION>0 gives the
   # verified tier signal (graded 0/25/50/75/100%). SEED_OVERCLAIMER_PER_JOB>0
   # seeds credential-fraud candidates (claim a job's skills, no on-chain proof)
   # so the verified tier has something real to suppress — required for the
   # fraud@5 metric and to keep the ranking metrics from saturating.
   # SEED_RESET=true truncates data tables first (preserves migrations/RBAC/
   # skill_catalog).
   SEED_RESET=true SEED_DEMO=true SEED_VERIFY_FRACTION=0.5 \
     SEED_OVERCLAIMER_PER_JOB=2 npm run seed
   npm run export:scores -- --build-embeddings   # needs AI service reachable
   ```
   IMPORTANT: `scores.json` and `labels.csv` must come from the SAME seed run —
   they join on UUID. After any re-seed, re-export scores AND regenerate labels
   (`bootstrap_labels.py --overwrite`), otherwise the join is empty and the
   metrics are undefined.
   Writes `evaluation/data/scores.json`. The `--build-embeddings` flag backfills
   candidate & job embeddings (the seed does not build them), so the semantic
   tier is non-zero. Drop the flag on later runs if embeddings already exist.

2. **Draft + review gold labels** (from `evaluation/`):
   ```bash
   python bootstrap_labels.py            # writes data/labels.csv (draft)
   ```
   Then **hand-review `data/labels.csv`**. The draft grades relevance from a
   hand-authored role-fit matrix (skill pool × job archetype) rather than raw
   skill overlap, so the gold set stays independent of the keyword tier and the
   ranker is not trivially perfect. Correcting ~50–100 rows by hand is what makes
   the gold set defensible. Re-running will NOT overwrite your edits unless you
   pass `--overwrite`.

3. **Baseline metrics** (40/50/10):
   ```bash
   python run_eval.py
   ```

4. **Learn weights, then compare**:
   ```bash
   python train_weights.py               # writes backend/config/match-weights.json
   python run_eval.py --compare          # baseline vs learned, side by side
   ```
   (`train_weights.py` needs scikit-learn. If the host lacks it, run inside the
   ai-service container: `docker cp` this folder in, run with
   `MATCH_WEIGHTS_OUT=/tmp/w.json`, then copy the file back to `backend/config/`.)

5. **Ablation — does the blockchain-verification signal help recruitment?**
   ```bash
   python run_eval.py --ablation --rel-threshold 3
   ```
   Compares learned vs learned-without-verified vs baseline. Reports the ranking
   metrics (with bootstrap 95% CIs) plus two trust-risk metrics, and a paired
   permutation test (per job) between with/without verified. Writes
   `report/ablation.json`. Expected story: removing the verified tier lets
   over-claimers climb the top-5, so **fraud@5 and claimed-only@5 rise** while
   **NDCG@5 drops** — verified-aware matching surfaces PROVEN candidates first.

6. **Verified-weight sweep — does the magnitude matter?** (answers "why 0.225
   and not just any positive value?")
   ```bash
   python run_eval.py --sweep --rel-threshold 3
   ```
   Holds the keyword:semantic ratio fixed and varies the verified share. Writes
   `report/sweep.json`. Expect fraud@5/claimed-only@5 to fall as the weight
   rises, while NDCG@5 holds then degrades once verified crowds out the semantic
   tier — giving an optimum near the learned weight.

7. **Honest evaluation modes (quote THESE in the report).** `--ablation`,
   `--compare` and plain runs are **IN-SAMPLE** (weights fit on all labelled
   pairs, then evaluated on the same pairs) — fine for illustration, not for
   stating performance. Use instead:
   ```bash
   python run_eval.py --holdout       # OUT-OF-SAMPLE: nested GroupKFold; weights
                                      #   learned on train jobs, scored on held-out
                                      #   jobs. Reports per-fold weight mean±sd and a
                                      #   paired permutation test (with vs without
                                      #   verified). → report/holdout.json
   python run_eval.py --real-only     # ablation on REAL candidates only (drops the
                                      #   synthetic over-claimers). Here verified is
                                      #   decoupled from the gold label, so any gain
                                      #   is non-circular. → report/real_only.json
   python run_eval.py --sensitivity   # learned verified weight + fraud@5/NDCG@5 as
                                      #   over-claimer prevalence varies 0→50%; shows
                                      #   the weight is contingent on the threat model,
                                      #   not a universal constant. → sensitivity.json
   python run_eval.py --baselines     # 3-tier vs keyword-only / semantic-only /
                                      #   verified-only rankers (a real baseline, not
                                      #   another hand weighting of the same model).
   python run_eval.py --diagnostics   # tier correlations + decorrelated (disjoint-
                                      #   basis) re-fit; verified stays the dominant
                                      #   positive signal after removing the
                                      #   keyword⊇verified collinearity.
   ```
   **Honest reading of the results:** on the full set the verified tier gives a
   significant NDCG@5/MRR lift, but that lift is driven by suppressing the
   relevance-0 over-claimers; the in-top-5 trust metrics (fraud@5, claimed-only@5)
   change but are **not** significant at this sample size (p≈0.5). On the real-only
   cut, verified does not change *who is relevant* (semantic+keyword already rank
   them) — it changes *which equally-relevant candidate surfaces first* (proven
   above unproven: claimed-only@5 ≈ 0.32→0.16). That is the trust-aware claim, and
   it is the honest one.

## Metric definitions (`metrics.py`, `run_eval.py`)

- **Precision@5** — fraction of the top-5 that are relevant (relevance ≥
  threshold; use `--rel-threshold 3` so positives are strict and metrics don't
  saturate).
- **Recall@10** — fraction of all relevant candidates that appear in the top-10.
- **NDCG@5 / NDCG@10** — graded ranking quality (gain `2^rel − 1`, `log2`
  discount), normalized by the ideal ordering. Report **@5**: @10 saturates near
  1.0 on a small candidate set and is not discriminative.
- **MRR** — mean reciprocal rank of the first relevant candidate.
- **claimed-only@5** — share of the top-5 (that match on skills) backed by
  self-declared skills only (no required skill verified on-chain). Lower better.
- **fraud@5** — share of the top-5 (that LOOK like a skill match) that are NOT
  genuinely relevant (gold relevance < threshold): the over-claimer risk the
  verified tier exists to suppress. Lower better.

All metrics are computed per job, then macro-averaged; jobs with no gold-relevant
candidate are skipped. CIs are percentile bootstrap (`stats.bootstrap_ci`);
the paired test is a sign-flip permutation test (`stats.paired_permutation_p`),
both standard-library only.

## Why over-claimers (read before defending)

Without a fraud population the verified tier is **orthogonal to relevance by
construction**, so no relevance metric can ever credit it and a bigger dataset
would NOT change that — only claimed-only@5 moves, which looks like the tier "does
nothing". `SEED_OVERCLAIMER_PER_JOB` injects candidates who game keyword/semantic
but hold no credential and are not a true fit; now the verified tier has a real
job (keep them out of the top), so fraud@5/NDCG@5 become discriminative AND the
weight magnitude acquires meaning (the sweep shows an optimum).

## Honest limitations (document in the thesis)

- Gold labels start from a hand-authored role-fit matrix (weak supervision);
  the over-claimer/fraud fraction is a controlled, author-set parameter — results
  characterize behaviour under a modelled fraud rate, not a measured one.
- The semantic tier is not explainable per-skill — only its weighted contribution
  is reported.
- The eval set is small; CIs and the paired test quantify the resulting
  uncertainty, but metrics are indicative, not production SLAs.
