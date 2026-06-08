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
   # verified tier signal (graded 0/25/50/75/100%). SEED_RESET=true truncates
   # data tables first (preserves migrations/RBAC/skill_catalog).
   SEED_RESET=true SEED_DEMO=true SEED_VERIFY_FRACTION=0.5 npm run seed
   npm run export:scores -- --build-embeddings   # needs AI service reachable
   ```
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
   python run_eval.py --ablation         # learned vs learned-without-verified vs baseline
   ```
   Reports ranking metrics plus **claimed-only@5** (the share of the top-5 that
   match on self-declared skills only — a trust-risk metric). The headline
   finding: dropping the verified signal barely changes ranking quality (NDCG),
   but roughly doubles claimed-only@5 — i.e. verified-aware matching surfaces
   PROVEN candidates first without hurting relevance. Writes `report/ablation.json`.

## Metric definitions (`metrics.py`)

- **Precision@5** — fraction of the top-5 ranked candidates that are relevant
  (relevance ≥ threshold, default 2).
- **Recall@10** — fraction of all relevant candidates that appear in the top-10.
- **NDCG@10** — graded ranking quality (gain `2^rel − 1`, `log2` discount),
  normalized by the ideal ordering.
- **MRR** — mean reciprocal rank of the first relevant candidate.

All metrics are computed per job, then macro-averaged. Jobs with no gold-relevant
candidate are skipped (undefined recall/MRR).

## Honest limitations (document in the thesis)

- Gold labels start from a hand-authored role-fit matrix (weak supervision);
  final quality depends on the manual review pass.
- The semantic tier is not explainable per-skill — only its weighted contribution
  is reported.
- The demo set is small (10 jobs); metrics are indicative, not production SLAs.
