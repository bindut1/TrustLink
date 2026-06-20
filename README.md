# TrustLink

Web platform where educational institutions issue blockchain-verified digital credentials, and an AI matching engine connects verified candidates with recruiters.

Matching scores are calculated based on blockchain-verified achievements, not self-declared information.

## Architecture

```
[Next.js Frontend] → [Nginx] → [NestJS Backend] ─┬─ [PostgreSQL + pgvector]
                                                   ├─ [Redis + Bull Queue]
                                                   ├─ [Python AI Service]
                                                   └─ [Polygon Blockchain]
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | NestJS (Node.js) |
| Frontend | Next.js + Tailwind |
| Database | PostgreSQL + pgvector |
| Blockchain | Solidity + Polygon Amoy |
| AI Service | Python FastAPI + intfloat/multilingual-e5-small |
| Queue | Bull + Redis |
| DevOps | Docker Compose |

## Project Structure

```
TrustLink/
├── backend/          # NestJS API
├── frontend/         # Next.js app
├── ai-service/       # Python FastAPI - sentence embedding
├── smart-contracts/  # Solidity + Hardhat
├── docker/           # Docker Compose + Nginx config
├── .env.example
└── TrustLink_Technical_Spec.md
```

## User Roles

- **Admin** — Manage users, approve institutions, monitor system
- **Issuer** — Issue/revoke credentials, batch import via Excel
- **Candidate** — View credentials, search jobs, apply with AI-ranked matching
- **Recruiter** — Post jobs, view ranked candidates, 1-click credential verification

## AI Matching (3-Tier)

Weights are learned by Logistic Regression on the gold-labelled set
(`ai-service/evaluation/train_weights.py` → `backend/config/match-weights.json`),
not hand-set — so they shift when the embedding model or dataset changes.

| Tier | Weight (learned) | Method |
|------|--------|--------|
| Keyword | 13% | SQL array overlap (required_skills vs candidate_skills) |
| Semantic | 27% | pgvector cosine similarity (384-dim `intfloat/multilingual-e5-small`), normalized per query pool |
| Verified Bonus | 60% | % of blockchain-verified skills |

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- Docker & Docker Compose

### Setup

```bash
# 1. Clone & copy env
cp .env.example .env

# 2. Start all services
docker compose -f docker/docker-compose.yml up -d

# 3. Deploy smart contracts (optional, for local dev)
cd smart-contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network localhost
```

### Services

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| AI Service | http://localhost:8000 |
| PgAdmin | http://localhost:5050 |

## License

MIT
