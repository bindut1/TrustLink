/**
 * Export the 3-tier score breakdown for each job's prefilter pool into a JSON
 * file consumed by the Python evaluation harness (ai-service/evaluation).
 *
 * Scores each job's pgvector prefilter pool (the same candidates the
 * recommendation endpoint reranks) so the semantic tier is normalized per-job
 * identically to runtime, and the ranking metrics (P@K, Recall@K, NDCG, MRR)
 * reflect the real end-to-end pipeline (prefilter + rerank). The raw per-tier
 * scores (0–100) are exported WITHOUT applying any weights — weighting is the
 * job of the Python side, so the same dump can be re-ranked under baseline vs
 * learned weights.
 *
 * The semantic tier needs embeddings to exist. The fresh seed does not build
 * them, so pass --build-embeddings to backfill candidate & job embeddings first
 * (requires the AI service to be reachable at AI_SERVICE_URL).
 *
 * Usage:
 *   npm run export:scores                  # assumes embeddings already exist
 *   npm run export:scores -- --build-embeddings
 */
import 'reflect-metadata';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { EmbeddingService } from '../modules/matching/embedding.service';
import { MatchingService } from '../modules/matching/matching.service';
import { Job } from '../database/entities/job.entity';
import { User } from '../database/entities/user.entity';
import { UserRole, AccountStatus } from '../database/enums';

interface ScoreRow {
  jobId: string;
  jobTitle: string;
  candidateId: string;
  candidateEmail: string;
  keywordScore: number;
  semanticScore: number;
  verifiedBonus: number;
}

const OUTPUT_PATH = join(
  __dirname,
  '../../../ai-service/evaluation/data/scores.json',
);

async function run() {
  const buildEmbeddings = process.argv.includes('--build-embeddings');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const dataSource = app.get(DataSource);
    const embeddingService = app.get(EmbeddingService);
    const matchingService = app.get(MatchingService);

    const jobs = await dataSource.getRepository(Job).find();
    const candidates = await dataSource.getRepository(User).find({
      where: { role: UserRole.CANDIDATE, status: AccountStatus.ACTIVE },
    });

    console.log(`Jobs: ${jobs.length}, Candidates: ${candidates.length}`);

    if (buildEmbeddings) {
      console.log('Building embeddings (this calls the AI service)...');
      for (const job of jobs) {
        await embeddingService.updateJobEmbedding(job.id);
      }
      for (const cand of candidates) {
        await embeddingService.updateCandidateEmbedding(cand.id);
      }
      console.log('  embeddings built.');
    }

    // Score per JOB over the SAME prefilter pool the recommendation endpoint
    // reranks, so the per-job semantic normalization is identical between this
    // training export and runtime serving. In the seed (#candidates < prefilter
    // limit) the pool is every candidate; at scale it correctly caps recall at
    // the prefilter — exactly as production does.
    const emailById = new Map(candidates.map((c) => [c.id, c.email]));
    const rows: ScoreRow[] = [];
    for (const job of jobs) {
      const poolIds = await matchingService.prefilterCandidatesForJob(job.id);
      const scored = await matchingService.scoreCandidatesForJob(job.id, poolIds);
      for (const s of scored) {
        rows.push({
          jobId: job.id,
          jobTitle: job.title,
          candidateId: s.candidateId,
          candidateEmail: emailById.get(s.candidateId) ?? '',
          keywordScore: s.keywordScore,
          semanticScore: s.semanticScore,
          verifiedBonus: s.verifiedBonus,
        });
      }
    }

    mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
    writeFileSync(OUTPUT_PATH, JSON.stringify(rows, null, 2));
    console.log(`\n✓ Wrote ${rows.length} score rows to ${OUTPUT_PATH}`);

    const semanticNonZero = rows.filter((r) => r.semanticScore > 0).length;
    if (semanticNonZero === 0) {
      console.warn(
        '⚠ All semantic scores are 0 — embeddings are likely missing. ' +
          'Re-run with --build-embeddings (AI service must be reachable).',
      );
    }
  } finally {
    await app.close();
  }
}

run().catch((err) => {
  console.error('Export failed:', err);
  process.exit(1);
});
