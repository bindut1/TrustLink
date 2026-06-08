import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Job } from '../../database/entities/job.entity';
import { JobStatus } from '../../database/enums';
import { User } from '../../database/entities/user.entity';
import { MatchingWeightsService } from './matching-weights.service';

/**
 * Why a candidate matches a job, expressed through the trust signal: which
 * required skills are proven on-chain vs only self-declared vs missing. This is
 * the core of the "trust-aware matching" thesis — the verification status IS the
 * explanation a recruiter sees.
 */
export interface MatchExplanation {
  matchedVerified: string[]; // required skills the candidate has AND verified on-chain
  matchedClaimedOnly: string[]; // required skills the candidate claims but hasn't verified
  missing: string[]; // required skills the candidate lacks
  // each tier's weighted contribution to totalScore (weight × tier score)
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
  // 'missing' = candidate doesn't have it; 'unverified' = claims it but no
  // on-chain credential backs it → recommend verifying via a credential.
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

    const [skillBreakdown, semanticScore] = await Promise.all([
      this.computeSkillTiers(candidateId, job.requiredSkills),
      this.computeSemanticScore(candidateId, jobId),
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

  /**
   * Career / learning-path: for a candidate against a target job, turn the match
   * gaps into actionable credential suggestions. Closes the trust loop — telling
   * candidates which credentials to *verify* drives adoption of the on-chain half.
   *
   * Gaps = required skills that are missing, plus required skills the candidate
   * claims but hasn't verified. Each gap is matched to the most semantically
   * similar credential type via embeddings (self-hosted, no LLM).
   */
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

    // Primary signal: which credential type has actually CERTIFIED this skill
    // before (its issued credentials' extractedSkills cover it). Grounded in real
    // data — far more sensible than blindly embedding a skill name against a
    // generic certificate title.
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
    // skill -> best (most-certifying) credential type
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
        similarity: hit ? 100 : 0, // exact skill coverage from issued credentials
      };
    });

    return { jobId, recommendations };
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
   * Tiers 1 & 3 in one pass, both anchored to the JOB's required skills:
   *   keywordScore  = matched required skills / total required * 100
   *   verifiedBonus = required skills the candidate has AND verified on-chain
   *                   / total required * 100
   * Also returns the explanation (verified / claimed-only / missing buckets).
   *
   * verifiedBonus is JD-relative on purpose: an unrelated verified credential
   * must NOT earn trust points for a job that doesn't require that skill.
   */
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

    // map normalized -> original display name (preserve job's casing for UI)
    const normToDisplay = new Map<string, string>();
    for (const s of requiredSkills) {
      const norm = s.trim().toLowerCase();
      if (norm && !normToDisplay.has(norm)) normToDisplay.set(norm, s.trim());
    }
    const normalized = [...normToDisplay.keys()];
    if (normalized.length === 0) {
      return { keywordScore: 0, verifiedBonus: 0, explanation: empty };
    }

    // candidate's skills that intersect the required set, with verified flag
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
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
