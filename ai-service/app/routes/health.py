from fastapi import APIRouter

from ..config import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    return {"status": "ok", "model": settings.model_name}
