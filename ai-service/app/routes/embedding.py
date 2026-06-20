from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

router = APIRouter()


class EncodeRequest(BaseModel):
    text: str = Field(..., min_length=1)


class EncodeResponse(BaseModel):
    embedding: list[float]


@router.post("/encode", response_model=EncodeResponse)
async def encode(request: Request, body: EncodeRequest) -> EncodeResponse:
    model = request.app.state.model
    embedding = model.encode(body.text, convert_to_numpy=True).tolist()
    return EncodeResponse(embedding=embedding)
