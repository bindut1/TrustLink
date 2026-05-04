from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

router = APIRouter()


class EncodeRequest(BaseModel):
    text: str = Field(..., min_length=1)


class EncodeResponse(BaseModel):
    embedding: list[float]


class EncodeBatchRequest(BaseModel):
    texts: list[str] = Field(..., min_length=1)


class EncodeBatchResponse(BaseModel):
    embeddings: list[list[float]]


@router.post("/encode", response_model=EncodeResponse)
async def encode(request: Request, body: EncodeRequest) -> EncodeResponse:
    model = request.app.state.model
    embedding = model.encode(body.text, convert_to_numpy=True).tolist()
    return EncodeResponse(embedding=embedding)


@router.post("/encode-batch", response_model=EncodeBatchResponse)
async def encode_batch(request: Request, body: EncodeBatchRequest) -> EncodeBatchResponse:
    model = request.app.state.model
    embeddings = model.encode(body.texts, convert_to_numpy=True).tolist()
    return EncodeBatchResponse(embeddings=embeddings)
