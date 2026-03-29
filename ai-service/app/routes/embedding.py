from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter()


class EmbeddingRequest(BaseModel):
    texts: list[str]


class EmbeddingResponse(BaseModel):
    embeddings: list[list[float]]
    dimension: int


@router.post("/embeddings", response_model=EmbeddingResponse)
async def generate_embeddings(request: Request, body: EmbeddingRequest):
    model = request.app.state.model
    embeddings = model.encode(body.texts).tolist()
    return EmbeddingResponse(
        embeddings=embeddings,
        dimension=len(embeddings[0]) if embeddings else 0,
    )
