"""Unit tests for the 3-tier /match scoring.

The matching route is pure numpy/sklearn — no embedding model needed — so we
mount it on a bare FastAPI app instead of app.main to keep these tests fast
(no sentence-transformers download/load).
"""

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routes import matching

app = FastAPI()
app.include_router(matching.router, prefix="/api/v1")
client = TestClient(app)


def match(payload: dict) -> list[dict]:
    r = client.post("/api/v1/match", json=payload)
    assert r.status_code == 200, r.text
    return r.json()["scores"]


BASE = {
    "job_embedding": [1.0, 0.0, 0.0],
    "candidate_embeddings": [[1.0, 0.0, 0.0]],
}


def test_identical_embedding_scores_100_semantic():
    scores = match(BASE)
    assert scores[0]["semantic_score"] == 100.0
    # default weights 0.3/0.5/0.2, only semantic contributes
    assert scores[0]["total_score"] == 50.0


def test_negative_cosine_is_clipped_to_zero():
    scores = match({
        "job_embedding": [1.0, 0.0],
        "candidate_embeddings": [[-1.0, 0.0]],
    })
    assert scores[0]["semantic_score"] == 0.0


def test_keyword_overlap_is_case_insensitive_and_jd_relative():
    scores = match({
        **BASE,
        "job_keywords": ["Python", "SQL"],
        "candidate_keywords": [["python", "docker"]],
    })
    # 1 of 2 required keywords matched
    assert scores[0]["keyword_score"] == 50.0


def test_empty_job_keywords_scores_zero_keyword_tier():
    scores = match({
        **BASE,
        "job_keywords": [],
        "candidate_keywords": [["python"]],
    })
    assert scores[0]["keyword_score"] == 0.0


def test_verified_flag_drives_bonus_and_defaults_to_false():
    flagged = match({
        "job_embedding": [1.0, 0.0],
        "candidate_embeddings": [[1.0, 0.0], [1.0, 0.0]],
        "verified_flags": [True, False],
    })
    by_index = {s["index"]: s for s in flagged}
    assert by_index[0]["verified_bonus"] == 100.0
    assert by_index[1]["verified_bonus"] == 0.0

    unflagged = match(BASE)
    assert unflagged[0]["verified_bonus"] == 0.0


def test_custom_weights_combine_tiers():
    scores = match({
        "job_embedding": [1.0, 0.0],
        "candidate_embeddings": [[1.0, 0.0]],
        "job_keywords": ["python"],
        "candidate_keywords": [["python"]],
        "verified_flags": [True],
        "keyword_weight": 0.4,
        "semantic_weight": 0.5,
        "verified_weight": 0.1,
    })
    # all three tiers are 1.0 → total = (0.4 + 0.5 + 0.1) * 100
    assert scores[0]["total_score"] == 100.0
    assert scores[0]["keyword_score"] == 100.0
    assert scores[0]["verified_bonus"] == 100.0


def test_ranking_sorted_descending_with_original_indices():
    scores = match({
        "job_embedding": [1.0, 0.0, 0.0],
        "candidate_embeddings": [
            [0.0, 1.0, 0.0],   # orthogonal → weakest
            [1.0, 0.0, 0.0],   # identical → strongest
            [1.0, 1.0, 0.0],   # in between
        ],
    })
    assert [s["index"] for s in scores] == [1, 2, 0]
    totals = [s["total_score"] for s in scores]
    assert totals == sorted(totals, reverse=True)


def test_verified_breaks_semantic_tie():
    scores = match({
        "job_embedding": [1.0, 0.0],
        "candidate_embeddings": [[1.0, 0.0], [1.0, 0.0]],
        "verified_flags": [False, True],
    })
    # identical semantics; the verified candidate must rank first
    assert scores[0]["index"] == 1
    assert scores[0]["total_score"] > scores[1]["total_score"]
