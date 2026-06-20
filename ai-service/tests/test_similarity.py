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
        assert r.json() == {"status": "ok", "model": "intfloat/multilingual-e5-small"}


def test_encode_dimension():
    with TestClient(app) as client:
        r = client.post("/encode", json={"text": "hello world"})
        assert r.status_code == 200
        emb = r.json()["embedding"]
        assert len(emb) == 384


def test_no_truncation_past_128_tokens():
    # Two texts that are identical for the first ~150 words and differ only
    # AFTER the old 128-token cutoff. With the previous MiniLM model (max 128)
    # the tail was truncated, so the embeddings were near-identical. e5-small
    # (max 512) must actually read the tail, producing distinct embeddings.
    head = " ".join(["experienced backend engineer"] * 50)  # ~150 tokens
    text_a = head + " specialised in Rust systems programming and WebAssembly"
    text_b = head + " specialised in frontend React and accessibility design"
    with TestClient(app) as client:
        r1 = client.post("/encode", json={"text": text_a})
        r2 = client.post("/encode", json={"text": text_b})
        sim = cosine(r1.json()["embedding"], r2.json()["embedding"])
        print(f"long-tail cosine similarity: {sim:.4f}")
        # If the tail were truncated the two would be ~identical (>0.99).
        assert sim < 0.98, f"tail likely truncated, got {sim:.4f}"


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
