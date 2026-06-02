import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Job } from '../../database/entities/job.entity';
import { JobStatus } from '../../database/enums';
import { User } from '../../database/entities/user.entity';

export interface ScoreBreakdown {
  candidateId: string;
  jobId: string;
  totalScore: number;
  keywordScore: number;
  semanticScore: number;
  verifiedBonus: number;
}

export interface RankedCandidate extends ScoreBreakdown {
  candidate: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    candidateProfile?: {
      bio: string | null;
      desiredPosition: string | null;
      yearsOfExperience: number;
      isOpenToWork: boolean;
      linkedinUrl: string | null;
      githubUrl: string | null;
      portfolioUrl: string | null;
      desiredSalaryMin: number | null;
      desiredSalaryMax: number | null;
    } | null;
  };
}

export interface RankedJob extends ScoreBreakdown {
  job: Pick<
    Job,
    'id' | 'title' | 'city' | 'isRemote' | 'salaryMin' | 'salaryMax'
  >;
}

const W_KEYWORD = 0.4;
const W_SEMANTIC = 0.5;
const W_VERIFIED = 0.1;

@Injectable()
export class MatchingService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Compute the full 3-tier score for one (candidate, job) pair. Returns zeros
   * for any tier whose source data is missing (e.g. embedding not yet built).
   */
  async calculateScore(
    candidateId: string,
    jobId: string,
  ): Promise<ScoreBreakdown> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    const [keywordScore, semanticScore, verifiedBonus] = await Promise.all([
      this.computeKeywordScore(candidateId, job.requiredSkills),
      this.computeSemanticScore(candidateId, jobId),
      this.computeVerifiedBonus(candidateId),
    ]);

    const totalScore =
      W_KEYWORD * keywordScore +
      W_SEMANTIC * semanticScore +
      W_VERIFIED * verifiedBonus;

    return {
      candidateId,
      jobId,
      totalScore: round(totalScore),
      keywordScore: round(keywordScore),
      semanticScore: round(semanticScore),
      verifiedBonus: round(verifiedBonus),
    };
  }

  /**
   * For a job: pick top-N candidates by pgvector cosine similarity, then
   * compute the full 3-tier score for each and rank by total.
   */
  async recommendCandidatesForJob(
    jobId: string,
    limit = 20,
  ): Promise<RankedCandidate[]> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    // Tier-2 prefilter: pick the most semantically-similar candidates first,
    // then full-rerank with all 3 tiers. Avoids scoring 10k candidates per
    // request when only 20 will be shown.
    const prefilterLimit = Math.max(limit * 5, 100);
    const rows = await this.dataSource.query<{ candidate_id: string }[]>(
      `SELECT ce.candidate_id
       FROM candidate_embeddings ce
       JOIN job_embeddings je ON je.job_id = $1
       JOIN users u ON u.id = ce.candidate_id
       WHERE u.status = 'active' AND u.role = 'candidate'
       ORDER BY ce.embedding <=> je.embedding ASC
       LIMIT $2`,
      [jobId, prefilterLimit],
    );

    if (rows.length === 0) return [];

    const candidateIds = rows.map((r) => r.candidate_id);
    const scored = await Promise.all(
      candidateIds.map((cid) => this.calculateScore(cid, jobId)),
    );

    const users = await this.userRepo.find({
      where: { id: In(candidateIds) },
      relations: ['candidateProfile'],
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return scored
      .map<RankedCandidate>((s) => {
        const u = userMap.get(s.candidateId)!;
        const cp = u.candidateProfile ?? null;
        return {
          ...s,
          candidate: {
            id: u.id,
            fullName: u.fullName,
            email: u.email,
            phone: u.phone,
            avatarUrl: u.avatarUrl,
            candidateProfile: cp
              ? {
                  bio: cp.bio,
                  desiredPosition: cp.desiredPosition,
                  yearsOfExperience: cp.yearsOfExperience,
                  isOpenToWork: cp.isOpenToWork,
                  linkedinUrl: cp.linkedinUrl,
                  githubUrl: cp.githubUrl,
                  portfolioUrl: cp.portfolioUrl,
                  desiredSalaryMin: cp.desiredSalaryMin,
                  desiredSalaryMax: cp.desiredSalaryMax,
                }
              : null,
          },
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);
  }

  /**
   * For a candidate: pick top-N open jobs by pgvector cosine similarity, then
   * full-rerank with all 3 tiers.
   */
  async recommendJobsForCandidate(
    candidateId: string,
    limit = 20,
  ): Promise<RankedJob[]> {
    const prefilterLimit = Math.max(limit * 5, 100);
    const rows = await this.dataSource.query<{ job_id: string }[]>(
      `SELECT je.job_id
       FROM job_embeddings je
       JOIN candidate_embeddings ce ON ce.candidate_id = $1
       JOIN jobs j ON j.id = je.job_id
       WHERE j.status = $2
       ORDER BY je.embedding <=> ce.embedding ASC
       LIMIT $3`,
      [candidateId, JobStatus.OPEN, prefilterLimit],
    );

    if (rows.length === 0) return [];

    const jobIds = rows.map((r) => r.job_id);
    const scored = await Promise.all(
      jobIds.map((jid) => this.calculateScore(candidateId, jid)),
    );

    const jobs = await this.jobRepo.findBy({ id: In(jobIds) });
    const jobMap = new Map(jobs.map((j) => [j.id, j]));

    return scored
      .map<RankedJob>((s) => {
        const j = jobMap.get(s.jobId)!;
        return {
          ...s,
          job: {
            id: j.id,
            title: j.title,
            city: j.city,
            isRemote: j.isRemote,
            salaryMin: j.salaryMin,
            salaryMax: j.salaryMax,
          },
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);
  }

  /**
   * Tier 1: SQL array overlap between job.required_skills and the candidate's
   * normalized skill names. Score = matched / total_required * 100.
   */
  private async computeKeywordScore(
    candidateId: string,
    requiredSkills: string[],
  ): Promise<number> {
    if (requiredSkills.length === 0) return 0;

    const normalized = requiredSkills
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (normalized.length === 0) return 0;

    const rows = await this.dataSource.query<{ matched: string }[]>(
      `SELECT COUNT(DISTINCT skill_name_normalized) AS matched
       FROM candidate_skills
       WHERE candidate_id = $1
         AND skill_name_normalized = ANY($2::text[])`,
      [candidateId, normalized],
    );
    const matched = parseInt(rows[0]?.matched ?? '0', 10);
    return (matched / normalized.length) * 100;
  }

  /**
   * Tier 2: pgvector cosine similarity. The `<=>` operator returns cosine
   * distance in [0, 2]; we map it to similarity in [0, 100].
   */
  private async computeSemanticScore(
    candidateId: string,
    jobId: string,
  ): Promise<number> {
    const rows = await this.dataSource.query<{ similarity: string }[]>(
      `SELECT (1 - (ce.embedding <=> je.embedding))::float8 AS similarity
       FROM candidate_embeddings ce, job_embeddings je
       WHERE ce.candidate_id = $1 AND je.job_id = $2`,
      [candidateId, jobId],
    );
    if (rows.length === 0) return 0;
    const sim = parseFloat(rows[0].similarity);
    if (!Number.isFinite(sim)) return 0;
    // Clamp to [0,1] — cosine is technically [-1,1] but for sentence embeddings
    // negative similarity is rare and meaningless for ranking.
    const clamped = Math.max(0, Math.min(1, sim));
    return clamped * 100;
  }

  /**
   * Tier 3: fraction of the candidate's skills that come from a
   * blockchain-verified credential.
   */
  private async computeVerifiedBonus(candidateId: string): Promise<number> {
    const rows = await this.dataSource.query<
      { total: string; verified: string }[]
    >(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE is_verified = true) AS verified
       FROM candidate_skills
       WHERE candidate_id = $1`,
      [candidateId],
    );
    const total = parseInt(rows[0]?.total ?? '0', 10);
    if (total === 0) return 0;
    const verified = parseInt(rows[0]?.verified ?? '0', 10);
    return (verified / total) * 100;
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
