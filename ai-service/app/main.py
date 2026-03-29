from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer

from .config import settings
from .routes import embedding, matching, health

ml_model: SentenceTransformer | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global ml_model
    print(f"Loading model: {settings.model_name}")
    ml_model = SentenceTransformer(settings.model_name)
    app.state.model = ml_model
    print("Model loaded successfully")
    yield
    print("Shutting down AI service")


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(embedding.router, prefix="/api/v1", tags=["embeddings"])
app.include_router(matching.router, prefix="/api/v1", tags=["matching"])
