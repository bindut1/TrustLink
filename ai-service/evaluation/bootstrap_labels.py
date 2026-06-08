"""Bootstrap gold relevance labels for the matcher evaluation set.

This produces a FIRST DRAFT of labels.csv that a human is expected to review and
correct. The draft is derived from the demo seed's known structure:

  * Each demo candidate `candidateN@trustlink.com` is seeded from skill pool
    index (N-1) % 7 (see backend/src/database/seeds/initial-seed.ts:pickSkillPool).
  * Each demo job has a fixed required-skills list (mirrored below).

Relevance is graded 0..3 from a hand-authored ROLE-FIT matrix (skill pool × job
archetype) — NOT from raw skill-string overlap. This is deliberate: defining
relevance as "does this candidate profile fit this role?" keeps the gold set
independent of the keyword tier (which is exact skill overlap), so the ranker is
not trivially perfect and there is real headroom to compare weightings. Example:
a Java-backend candidate is marked marginally relevant (1) to a Node.js backend
role even though their exact required-skill overlap is zero.

CAVEAT (state this in the thesis): this matrix is the author's judgement and a
WEAK-SUPERVISION starting point. The committed labels.csv must still be
hand-reviewed. Manual edits are preserved unless you re-run with --overwrite.

Usage:
    python bootstrap_labels.py            # write data/labels.csv if absent
    python bootstrap_labels.py --overwrite
"""
from __future__ import annotations

import csv
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SCORES_PATH = os.path.join(HERE, "data", "scores.json")
LABELS_PATH = os.path.join(HERE, "data", "labels.csv")

# Seed skill pools (index -> archetype). Source of truth:
# backend/src/database/seeds/initial-seed.ts (SKILL_POOLS, pickSkillPool).
#   0 Backend (Node)   1 Frontend (React)   2 AI/ML (Python)
#   3 Cloud/DevOps     4 Java backend       5 Mobile (RN)        6 QA
N_POOLS = 7

# Hand-authored ROLE-FIT matrix: job title -> {pool_index: relevance 0..3}.
# Pools not listed are 0 (irrelevant). This is the author's judgement of which
# candidate archetype fits each role, intentionally broader than exact skill
# overlap (e.g. Java backend -> Node backend role = 1).
JOB_POOL_RELEVANCE: dict[str, dict[int, int]] = {
    "Senior Backend Engineer (Node.js)": {0: 3, 4: 1, 3: 1},
    "Frontend Engineer (React)":         {1: 3, 5: 1},
    "Cloud Engineer (AWS)":              {3: 3, 0: 1},
    "Mobile Developer (React Native)":   {5: 3, 1: 1},
    "Data Engineer":                     {2: 2, 4: 1},
    "DevOps Engineer":                   {3: 3, 0: 1},
    "Junior Backend Developer":          {4: 3, 0: 2},
    "AI/ML Engineer":                    {2: 3},
    "Fullstack Engineer (PERN)":         {0: 2, 1: 2},
    "QA Automation Engineer":            {6: 3},
}


def pool_index_for_email(email: str) -> int | None:
    m = re.match(r"candidate(\d+)@", email)
    if not m:
        return None
    n = int(m.group(1))
    return (n - 1) % N_POOLS


def grade(job_title: str, pool_index: int) -> int:
    return JOB_POOL_RELEVANCE.get(job_title, {}).get(pool_index, 0)


def main() -> None:
    overwrite = "--overwrite" in sys.argv

    if os.path.exists(LABELS_PATH) and not overwrite:
        print(
            f"✗ {LABELS_PATH} already exists. Refusing to clobber manual edits.\n"
            f"  Pass --overwrite to regenerate the draft from scratch."
        )
        return

    if not os.path.exists(SCORES_PATH):
        print(f"✗ {SCORES_PATH} not found. Run `npm run export:scores` first.")
        sys.exit(1)

    with open(SCORES_PATH, encoding="utf-8") as f:
        rows = json.load(f)

    out: list[dict] = []
    unknown_jobs: set[str] = set()
    for r in rows:
        pool_index = pool_index_for_email(r["candidateEmail"])
        if r["jobTitle"] not in JOB_POOL_RELEVANCE:
            unknown_jobs.add(r["jobTitle"])
            relevance = 0
        elif pool_index is None:
            relevance = 0
        else:
            relevance = grade(r["jobTitle"], pool_index)
        out.append(
            {
                "job_id": r["jobId"],
                "job_title": r["jobTitle"],
                "candidate_id": r["candidateId"],
                "candidate_email": r["candidateEmail"],
                "relevance": relevance,
            }
        )

    os.makedirs(os.path.dirname(LABELS_PATH), exist_ok=True)
    with open(LABELS_PATH, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["job_id", "job_title", "candidate_id", "candidate_email", "relevance"],
        )
        writer.writeheader()
        writer.writerows(out)

    pos = sum(1 for o in out if o["relevance"] >= 2)
    print(f"✓ Wrote {len(out)} draft labels to {LABELS_PATH}")
    print(f"  relevant (>=2): {pos}  |  irrelevant: {len(out) - pos}")
    if unknown_jobs:
        print(f"⚠ Job titles not in JOB_REQUIRED_SKILLS (labelled 0): {sorted(unknown_jobs)}")
    print("→ Now hand-review data/labels.csv before trusting the metrics.")


if __name__ == "__main__":
    main()
