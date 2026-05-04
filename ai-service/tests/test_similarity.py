import numpy as np
from fastapi.testclient import TestClient

from app.main import app


def cosine(a: list[float], b: list[float]) -> float:
    av, bv = np.array(a), np.array(b)
    return float(np.dot(av, bv) / (np.linalg.norm(av) * np.linalg.norm(bv)))


def test_health():
    with TestClient(app) as client:
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json() == {"status": "ok", "model": "paraphrase-multilingual-MiniLM-L12-v2"}


def test_encode_dimension():
    with TestClient(app) as client:
        r = client.post("/encode", json={"text": "hello world"})
        assert r.status_code == 200
        emb = r.json()["embedding"]
        assert len(emb) == 384


def test_encode_batch_dimension():
    with TestClient(app) as client:
        r = client.post("/encode-batch", json={"texts": ["a", "b", "c"]})
        assert r.status_code == 200
        embs = r.json()["embeddings"]
        assert len(embs) == 3
        assert all(len(e) == 384 for e in embs)


def test_cross_lingual_java_similarity():
    with TestClient(app) as client:
        r1 = client.post("/encode", json={"text": "Java developer"})
        r2 = client.post("/encode", json={"text": "Lập trình viên Java"})
        sim = cosine(r1.json()["embedding"], r2.json()["embedding"])
        print(f"EN/VN cosine similarity: {sim:.4f}")
        assert sim > 0.8, f"expected > 0.8, got {sim:.4f}"


def test_cross_lingual_full_phrase_similarity():
    with TestClient(app) as client:
        r1 = client.post("/encode", json={"text": "Java developer Spring Boot"})
        r2 = client.post("/encode", json={"text": "Lập trình viên Java Spring Boot"})
        sim = cosine(r1.json()["embedding"], r2.json()["embedding"])
        print(f"EN/VN full-phrase cosine similarity: {sim:.4f}")
        assert sim > 0.8, f"expected > 0.8, got {sim:.4f}"
