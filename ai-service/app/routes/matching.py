from fastapi import APIRouter, Request
from pydantic import BaseModel
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

router = APIRouter()


class MatchRequest(BaseModel):
    job_embedding: list[float]
    candidate_embeddings: list[list[float]]
    job_keywords: list[str] = []
    candidate_keywords: list[list[str]] = []
    verified_flags: list[bool] = []
    keyword_weight: float = 0.3
    semantic_weight: float = 0.5
    verified_weight: float = 0.2


class CandidateScore(BaseModel):
    index: int
    total_score: float
    keyword_score: float
    semantic_score: float
    verified_bonus: float


class MatchResponse(BaseModel):
    scores: list[CandidateScore]


@router.post("/match", response_model=MatchResponse)
async def match_candidates(request: Request, body: MatchRequest):
    job_emb = np.array(body.job_embedding).reshape(1, -1)
    cand_embs = np.array(body.candidate_embeddings)

    semantic_scores = cosine_similarity(job_emb, cand_embs)[0]
    semantic_scores = np.clip(semantic_scores, 0, 1)

    job_kw_set = set(kw.lower() for kw in body.job_keywords)
    keyword_scores = []
    for kws in body.candidate_keywords:
        if not job_kw_set:
            keyword_scores.append(0.0)
        else:
            overlap = len(set(k.lower() for k in kws) & job_kw_set)
            keyword_scores.append(overlap / len(job_kw_set))
    keyword_scores = np.array(keyword_scores) if keyword_scores else np.zeros(len(cand_embs))

    verified = np.array(
        body.verified_flags if body.verified_flags else [False] * len(cand_embs),
        dtype=float,
    )

    total = (
        body.keyword_weight * keyword_scores
        + body.semantic_weight * semantic_scores
        + body.verified_weight * verified
    ) * 100

    results = []
    for i in range(len(cand_embs)):
        results.append(CandidateScore(
            index=i,
            total_score=round(float(total[i]), 2),
            keyword_score=round(float(keyword_scores[i]) * 100, 2),
            semantic_score=round(float(semantic_scores[i]) * 100, 2),
            verified_bonus=round(float(verified[i]) * 100, 2),
        ))

    results.sort(key=lambda x: x.total_score, reverse=True)
    return MatchResponse(scores=results)
