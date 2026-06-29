import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Job } from '../../database/entities/job.entity';
import { JobStatus } from '../../database/enums';
import { User } from '../../database/entities/user.entity';
import { MatchingWeightsService } from './matching-weights.service';

const SEMANTIC_COSINE_FLOOR = 0.85;
const SEMANTIC_COSINE_CEIL = 0.96;

function rescaleSemantic(cosine: number): number {
  const stretched =
    (cosine - SEMANTIC_COSINE_FLOOR) /
    (SEMANTIC_COSINE_CEIL - SEMANTIC_COSINE_FLOOR);
  return Math.max(0, Math.min(1, stretched)) * 100;
}

export interface MatchExplanation {
  matchedVerified: string[];
  matchedClaimedOnly: string[];
  missing: string[];
  contributions: { keyword: number; semantic: number; verified: number };
}

export interface ScoreBreakdown {
  candidateId: string;
  jobId: string;
  totalScore: number;
  keywordScore: number;
  semanticScore: number;
  verifiedBonus: number;
  explanation: MatchExplanation;
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
      resumeUrl: string | null;
      dateOfBirth: Date | null;
      gender: string | null;
      desiredSalaryMin: number | null;
      desiredSalaryMax: number | null;
      preferredLocations: unknown;
    } | null;
  };
}

export interface RankedJob extends ScoreBreakdown {
  job: Pick<
    Job,
    'id' | 'title' | 'city' | 'isRemote' | 'salaryMin' | 'salaryMax'
  >;
}

export interface LearningRecommendation {
  skill: string;
  status: 'missing' | 'unverified';
  recommendedCredential: { id: string; name: string } | null;
  similarity: number;
}

@Injectable()
export class MatchingService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly weights: MatchingWeightsService,
  ) {}

  async calculateScore(
    candidateId: string,
    jobId: string,
    precomputedSemanticScore?: number,
  ): Promise<ScoreBreakdown> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    const [skillBreakdown, semanticScore] = await Promise.all([
      this.computeSkillTiers(candidateId, job.requiredSkills),
      precomputedSemanticScore !== undefined
        ? Promise.resolve(precomputedSemanticScore)
        : this.computeSemanticScore(candidateId, jobId),
    ]);
    const { keywordScore, verifiedBonus, explanation } = skillBreakdown;
    const w = this.weights.get();

    const totalScore =
      w.keyword * keywordScore +
      w.semantic * semanticScore +
      w.verified * verifiedBonus;

    explanation.contributions = {
      keyword: round(w.keyword * keywordScore),
      semantic: round(w.semantic * semanticScore),
      verified: round(w.verified * verifiedBonus),
    };

    return {
      candidateId,
      jobId,
      totalScore: round(totalScore),
      keywordScore: round(keywordScore),
      semanticScore: round(semanticScore),
      verifiedBonus: round(verifiedBonus),
      explanation,
    };
  }

  async scoreCandidatesForJob(
    jobId: string,
    candidateIds: string[],
  ): Promise<ScoreBreakdown[]> {
    const semMap = await this.computeNormalizedSemanticScores(
      'job',
      jobId,
      candidateIds,
    );
    return Promise.all(
      candidateIds.map((cid) =>
        this.calculateScore(cid, jobId, semMap.get(cid)),
      ),
    );
  }

  async prefilterCandidatesForJob(
    jobId: string,
    limit = 20,
  ): Promise<string[]> {
    const prefilterLimit = Math.max(limit * 5, 100);
    const rows = await this.dataSource.query<{ candidate_id: string }[]>(
      `SELECT ce.candidate_id
       FROM candidate_embeddings ce
       JOIN job_embeddings je ON je.job_id = $1
       JOIN users u ON u.id = ce.candidate_id
       JOIN candidate_profiles cp ON cp.user_id = ce.candidate_id
       WHERE u.status = 'active' AND u.role = 'candidate'
         AND cp.is_open_to_work = TRUE
       ORDER BY ce.embedding <=> je.embedding ASC
       LIMIT $2`,
      [jobId, prefilterLimit],
    );
    return rows.map((r) => r.candidate_id);
  }

  async scoreJobsForCandidate(
    candidateId: string,
    jobIds: string[],
  ): Promise<ScoreBreakdown[]> {
    const semMap = await this.computeNormalizedSemanticScores(
      'candidate',
      candidateId,
      jobIds,
    );
    return Promise.all(
      jobIds.map((jid) =>
        this.calculateScore(candidateId, jid, semMap.get(jid)),
      ),
    );
  }

  private async computeNormalizedSemanticScores(
    anchor: 'job' | 'candidate',
    anchorId: string,
    poolIds: string[],
  ): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    if (poolIds.length === 0) return result;

    const sql =
      anchor === 'job'
        ? `SELECT ce.candidate_id::text AS id,
                  (1 - (ce.embedding <=> je.embedding))::float8 AS sim
           FROM candidate_embeddings ce
           JOIN job_embeddings je ON je.job_id = $1
           WHERE ce.candidate_id::text = ANY($2::text[])`
        : `SELECT je.job_id::text AS id,
                  (1 - (ce.embedding <=> je.embedding))::float8 AS sim
           FROM job_embeddings je
           JOIN candidate_embeddings ce ON ce.candidate_id = $1
           WHERE je.job_id::text = ANY($2::text[])`;

    const rows = await this.dataSource.query<{ id: string; sim: string }[]>(
      sql,
      [anchorId, poolIds],
    );

    const sims = rows
      .map((r) => ({ id: r.id, sim: parseFloat(r.sim) }))
      .filter((r) => Number.isFinite(r.sim));
    if (sims.length === 0) return result;

    const values = sims.map((s) => s.sim);
    const min = Math.min(...values);
    const range = Math.max(...values) - min;

    for (const { id, sim } of sims) {
      result.set(
        id,
        range > 1e-6 ? ((sim - min) / range) * 100 : rescaleSemantic(sim),
      );
    }
    return result;
  }

  async recommendLearningPath(
    candidateId: string,
    jobId: string,
  ): Promise<{ jobId: string; recommendations: LearningRecommendation[] }> {
    const score = await this.calculateScore(candidateId, jobId);
    const gaps: { skill: string; status: 'missing' | 'unverified' }[] = [
      ...score.explanation.missing.map((skill) => ({
        skill,
        status: 'missing' as const,
      })),
      ...score.explanation.matchedClaimedOnly.map((skill) => ({
        skill,
        status: 'unverified' as const,
      })),
    ];
    if (gaps.length === 0) return { jobId, recommendations: [] };

    const coverage = await this.dataSource.query<
      { type_id: string; name: string; skill: string; n: string }[]
    >(
      `SELECT ct.id AS type_id,
              COALESCE(ct.name_en, ct.name) AS name,
              lower(trim(skill)) AS skill,
              COUNT(*) AS n
       FROM credentials c
       JOIN credential_types ct ON ct.id = c.credential_type_id
       CROSS JOIN LATERAL unnest(c.extracted_skills) AS skill
       WHERE c.status = 'issued'
       GROUP BY ct.id, name, lower(trim(skill))`,
    );
    const bySkill = new Map<string, { id: string; name: string; n: number }>();
    for (const row of coverage) {
      const cur = bySkill.get(row.skill);
      const n = parseInt(row.n, 10);
      if (!cur || n > cur.n) {
        bySkill.set(row.skill, { id: row.type_id, name: row.name, n });
      }
    }

    const recommendations: LearningRecommendation[] = gaps.map((g) => {
      const hit = bySkill.get(g.skill.trim().toLowerCase());
      return {
        ...g,
        recommendedCredential: hit ? { id: hit.id, name: hit.name } : null,
        similarity: hit ? 100 : 0,
      };
    });

    return { jobId, recommendations };
  }

  async recommendCandidatesForJob(
    jobId: string,
    limit = 20,
  ): Promise<RankedCandidate[]> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    const candidateIds = await this.prefilterCandidatesForJob(jobId, limit);
    if (candidateIds.length === 0) return [];

    const scored = await this.scoreCandidatesForJob(jobId, candidateIds);

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
                  resumeUrl: cp.resumeUrl,
                  dateOfBirth: cp.dateOfBirth,
                  gender: cp.gender,
                  desiredSalaryMin: cp.desiredSalaryMin,
                  desiredSalaryMax: cp.desiredSalaryMax,
                  preferredLocations: cp.preferredLocations,
                }
              : null,
          },
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);
  }

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
    const scored = await this.scoreJobsForCandidate(candidateId, jobIds);

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

  private async computeSkillTiers(
    candidateId: string,
    requiredSkills: string[],
  ): Promise<{
    keywordScore: number;
    verifiedBonus: number;
    explanation: MatchExplanation;
  }> {
    const empty: MatchExplanation = {
      matchedVerified: [],
      matchedClaimedOnly: [],
      missing: [],
      contributions: { keyword: 0, semantic: 0, verified: 0 },
    };

    const normToDisplay = new Map<string, string>();
    for (const s of requiredSkills) {
      const norm = s.trim().toLowerCase();
      if (norm && !normToDisplay.has(norm)) normToDisplay.set(norm, s.trim());
    }
    const normalized = [...normToDisplay.keys()];
    if (normalized.length === 0) {
      return { keywordScore: 0, verifiedBonus: 0, explanation: empty };
    }

    const rows = await this.dataSource.query<
      { name: string; is_verified: boolean }[]
    >(
      `SELECT skill_name_normalized AS name, bool_or(is_verified) AS is_verified
       FROM candidate_skills
       WHERE candidate_id = $1
         AND skill_name_normalized = ANY($2::text[])
       GROUP BY skill_name_normalized`,
      [candidateId, normalized],
    );

    const matched = new Map(rows.map((r) => [r.name, r.is_verified]));
    const matchedVerified: string[] = [];
    const matchedClaimedOnly: string[] = [];
    const missing: string[] = [];
    for (const [norm, display] of normToDisplay) {
      if (!matched.has(norm)) missing.push(display);
      else if (matched.get(norm)) matchedVerified.push(display);
      else matchedClaimedOnly.push(display);
    }

    const matchedCount = matchedVerified.length + matchedClaimedOnly.length;
    const keywordScore = (matchedCount / normalized.length) * 100;
    const verifiedBonus = (matchedVerified.length / normalized.length) * 100;

    return {
      keywordScore,
      verifiedBonus,
      explanation: {
        matchedVerified,
        matchedClaimedOnly,
        missing,
        contributions: { keyword: 0, semantic: 0, verified: 0 },
      },
    };
  }

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
    return rescaleSemantic(sim);
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
