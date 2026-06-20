import { NotFoundException } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { MatchingWeightsService } from './matching-weights.service';

type SkillRow = { name: string; is_verified: boolean };
type CoverageRow = { type_id: string; name: string; skill: string; n: string };

/**
 * Routes the raw-SQL queries MatchingService issues through DataSource.query,
 * keyed by recognizable fragments of each statement.
 */
interface Routes {
  skills?: (candidateId: string) => SkillRow[];
  similarity?: (candidateId: string, jobId: string) => string | null;
  coverage?: CoverageRow[];
  candidatePrefilter?: { candidate_id: string }[];
  jobPrefilter?: { job_id: string }[];
}

function makeDataSource(routes: Routes) {
  return {
    query: jest.fn((sql: string, params: unknown[] = []) => {
      if (sql.includes('FROM candidate_skills')) {
        return Promise.resolve(routes.skills?.(params[0] as string) ?? []);
      }
      if (sql.includes('credential_types')) {
        return Promise.resolve(routes.coverage ?? []);
      }
      // Per-job semantic normalization (anchor = job, pool = candidates).
      // Must be checked before the generic prefilter routes below.
      if (sql.includes('ce.candidate_id::text = ANY')) {
        const jobId = params[0] as string;
        const ids = (params[1] as string[]) ?? [];
        return Promise.resolve(
          ids
            .map((cid) => ({ id: cid, sim: routes.similarity?.(cid, jobId) }))
            .filter((r) => r.sim != null),
        );
      }
      // Per-candidate semantic normalization (anchor = candidate, pool = jobs).
      if (sql.includes('je.job_id::text = ANY')) {
        const candId = params[0] as string;
        const ids = (params[1] as string[]) ?? [];
        return Promise.resolve(
          ids
            .map((jid) => ({ id: jid, sim: routes.similarity?.(candId, jid) }))
            .filter((r) => r.sim != null),
        );
      }
      if (sql.includes('candidate_embeddings ce, job_embeddings je')) {
        const sim = routes.similarity?.(
          params[0] as string,
          params[1] as string,
        );
        return Promise.resolve(sim == null ? [] : [{ similarity: sim }]);
      }
      if (sql.includes('FROM candidate_embeddings ce')) {
        return Promise.resolve(routes.candidatePrefilter ?? []);
      }
      if (sql.includes('FROM job_embeddings je')) {
        return Promise.resolve(routes.jobPrefilter ?? []);
      }
      return Promise.reject(new Error(`unexpected query: ${sql}`));
    }),
  };
}

const WEIGHTS = { keyword: 0.4, semantic: 0.5, verified: 0.1 };
const weightsStub = { get: () => WEIGHTS } as MatchingWeightsService;

function makeJob(overrides: Record<string, unknown> = {}) {
  return {
    id: 'job-1',
    title: 'Backend Engineer',
    city: 'Hanoi',
    isRemote: false,
    salaryMin: 1000,
    salaryMax: 2000,
    requiredSkills: ['React', 'Node.js', 'GraphQL', 'Docker'],
    ...overrides,
  };
}

function makeService(routes: Routes, jobs: Record<string, unknown> = {}) {
  const jobMap = new Map(Object.entries(jobs));
  const jobRepo = {
    findOne: jest.fn(({ where: { id } }: { where: { id: string } }) =>
      Promise.resolve(jobMap.get(id) ?? null),
    ),
    findBy: jest.fn(() => Promise.resolve([...jobMap.values()])),
  };
  const userRepo = {
    find: jest.fn(() => Promise.resolve([])),
  };
  const ds = makeDataSource(routes);
  const service = new MatchingService(
    ds as never,
    jobRepo as never,
    userRepo as never,
    weightsStub,
  );
  return { service, jobRepo, userRepo, ds };
}

describe('MatchingService.calculateScore', () => {
  it('combines the 3 tiers with the configured weights', async () => {
    const { service } = makeService(
      {
        skills: () => [
          { name: 'react', is_verified: true },
          { name: 'node.js', is_verified: false },
        ],
      },
      { 'job-1': makeJob() },
    );

    // semantic is passed in precomputed (the per-pool-normalized value the
    // ranking path supplies); this isolates the tier-combination logic.
    const score = await service.calculateScore('cand-1', 'job-1', 80);

    // keyword: 2 of 4 required matched; verified: 1 of 4 proven on-chain
    expect(score.keywordScore).toBe(50);
    expect(score.semanticScore).toBe(80);
    expect(score.verifiedBonus).toBe(25);
    // 0.4*50 + 0.5*80 + 0.1*25
    expect(score.totalScore).toBe(62.5);
    expect(score.explanation.contributions).toEqual({
      keyword: 20,
      semantic: 40,
      verified: 2.5,
    });
  });

  it('buckets required skills into verified / claimed-only / missing with display casing', async () => {
    const { service } = makeService(
      {
        skills: () => [
          { name: 'react', is_verified: true },
          { name: 'node.js', is_verified: false },
        ],
        similarity: () => '0.5',
      },
      { 'job-1': makeJob() },
    );

    const { explanation } = await service.calculateScore('cand-1', 'job-1');

    expect(explanation.matchedVerified).toEqual(['React']);
    expect(explanation.matchedClaimedOnly).toEqual(['Node.js']);
    expect(explanation.missing).toEqual(['GraphQL', 'Docker']);
  });

  it('throws NotFoundException when the job does not exist', async () => {
    const { service } = makeService({}, {});
    await expect(service.calculateScore('cand-1', 'nope')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('scores zero keyword/verified tiers when the job requires no skills', async () => {
    const { service } = makeService(
      {},
      { 'job-1': makeJob({ requiredSkills: [] }) },
    );

    const score = await service.calculateScore('cand-1', 'job-1', 60);

    expect(score.keywordScore).toBe(0);
    expect(score.verifiedBonus).toBe(0);
    expect(score.semanticScore).toBe(60);
    expect(score.totalScore).toBe(30); // 0.5 * 60
  });

  it('single-pair fallback stretches the e5 cosine band [0.85,0.96] onto 0-100', async () => {
    // No precomputed semantic -> computeSemanticScore + rescaleSemantic.
    const job = { 'job-1': makeJob({ requiredSkills: [] }) };

    const ceil = makeService({ skills: () => [], similarity: () => '0.96' }, job);
    expect((await ceil.service.calculateScore('cand-1', 'job-1')).semanticScore).toBe(
      100,
    ); // band ceiling

    const floor = makeService({ skills: () => [], similarity: () => '0.85' }, job);
    expect(
      (await floor.service.calculateScore('cand-1', 'job-1')).semanticScore,
    ).toBe(0); // band floor (and anything below)
  });

  it('dedupes and normalizes required skills (case/whitespace)', async () => {
    const { service } = makeService(
      {
        skills: () => [{ name: 'react', is_verified: true }],
        similarity: () => '0',
      },
      { 'job-1': makeJob({ requiredSkills: ['React', ' react ', 'NODE.js'] }) },
    );

    const score = await service.calculateScore('cand-1', 'job-1');

    // 'React' and ' react ' collapse to one required skill → 2 distinct
    expect(score.keywordScore).toBe(50);
    expect(score.verifiedBonus).toBe(50);
    expect(score.explanation.matchedVerified).toEqual(['React']);
    expect(score.explanation.missing).toEqual(['NODE.js']);
  });

  it('returns 0 semantic score when no embedding pair exists', async () => {
    const { service } = makeService(
      { skills: () => [] },
      { 'job-1': makeJob() },
    );

    const score = await service.calculateScore('cand-1', 'job-1');
    expect(score.semanticScore).toBe(0);
  });

  it.each([
    ['1.4', 100], // clamped above
    ['-0.3', 0], // clamped below
    ['NaN', 0], // non-finite → 0
  ])('clamps similarity %s to %d', async (raw, expected) => {
    const { service } = makeService(
      { skills: () => [], similarity: () => raw },
      { 'job-1': makeJob() },
    );

    const score = await service.calculateScore('cand-1', 'job-1');
    expect(score.semanticScore).toBe(expected);
  });
});

describe('MatchingService.recommendLearningPath', () => {
  it('returns no recommendations when every required skill is verified', async () => {
    const { service } = makeService(
      {
        skills: () => [
          { name: 'react', is_verified: true },
          { name: 'node.js', is_verified: true },
        ],
        similarity: () => '0.9',
      },
      { 'job-1': makeJob({ requiredSkills: ['React', 'Node.js'] }) },
    );

    const result = await service.recommendLearningPath('cand-1', 'job-1');
    expect(result.recommendations).toEqual([]);
  });

  it('maps missing and unverified gaps to the most-certifying credential type', async () => {
    const { service } = makeService(
      {
        skills: () => [{ name: 'node.js', is_verified: false }],
        similarity: () => '0.9',
        coverage: [
          { type_id: 'ct-1', name: 'Docker Basics', skill: 'docker', n: '3' },
          { type_id: 'ct-2', name: 'DevOps Cert', skill: 'docker', n: '7' },
        ],
      },
      { 'job-1': makeJob({ requiredSkills: ['Node.js', 'Docker'] }) },
    );

    const { recommendations } = await service.recommendLearningPath(
      'cand-1',
      'job-1',
    );

    expect(recommendations).toHaveLength(2);
    const docker = recommendations.find((r) => r.skill === 'Docker')!;
    expect(docker.status).toBe('missing');
    // ct-2 certified 'docker' more often (7 > 3) so it wins
    expect(docker.recommendedCredential).toEqual({
      id: 'ct-2',
      name: 'DevOps Cert',
    });
    expect(docker.similarity).toBe(100);

    const node = recommendations.find((r) => r.skill === 'Node.js')!;
    expect(node.status).toBe('unverified');
    expect(node.recommendedCredential).toBeNull();
    expect(node.similarity).toBe(0);
  });
});

describe('MatchingService.scoreCandidatesForJob (per-job semantic normalization)', () => {
  it('min-max normalizes the pool: best candidate -> 100, weakest -> 0', async () => {
    const cosByCand: Record<string, string> = {
      'c-hi': '0.95',
      'c-mid': '0.90',
      'c-lo': '0.86',
    };
    const { service } = makeService(
      { skills: () => [], similarity: (cid) => cosByCand[cid] ?? null },
      { 'job-1': makeJob({ requiredSkills: [] }) },
    );

    const scored = await service.scoreCandidatesForJob('job-1', [
      'c-hi',
      'c-mid',
      'c-lo',
    ]);
    const sem = new Map(scored.map((s) => [s.candidateId, s.semanticScore]));

    expect(sem.get('c-hi')).toBe(100); // pool max
    expect(sem.get('c-lo')).toBe(0); // pool min
    // c-mid: (0.90-0.86)/(0.95-0.86)*100 ≈ 44.44 — RELATIVE to the pool, not absolute
    expect(sem.get('c-mid')).toBeCloseTo(44.44, 1);
  });

  it('falls back to the absolute rescale when the pool has no semantic spread', async () => {
    const { service } = makeService(
      { skills: () => [], similarity: () => '0.96' },
      { 'job-1': makeJob({ requiredSkills: [] }) },
    );
    // All identical cosines -> range ~0 -> rescaleSemantic(0.96) = 100 (not 50/NaN)
    const scored = await service.scoreCandidatesForJob('job-1', ['a', 'b']);
    expect(scored.every((s) => s.semanticScore === 100)).toBe(true);
  });
});

describe('MatchingService.recommendCandidatesForJob', () => {
  const skillsByCandidate: Record<string, SkillRow[]> = {
    'cand-strong': [
      { name: 'react', is_verified: true },
      { name: 'node.js', is_verified: true },
      { name: 'graphql', is_verified: false },
      { name: 'docker', is_verified: false },
    ],
    'cand-weak': [{ name: 'react', is_verified: false }],
  };
  const similarityByCandidate: Record<string, string> = {
    'cand-strong': '0.9',
    'cand-weak': '0.4',
  };

  function makeRankedSetup() {
    const setup = makeService(
      {
        skills: (cid) => skillsByCandidate[cid] ?? [],
        similarity: (cid) => similarityByCandidate[cid] ?? null,
        candidatePrefilter: [
          { candidate_id: 'cand-weak' },
          { candidate_id: 'cand-strong' },
        ],
      },
      { 'job-1': makeJob() },
    );
    setup.userRepo.find.mockResolvedValue([
      {
        id: 'cand-strong',
        fullName: 'Strong Dev',
        email: 's@x.vn',
        phone: null,
        avatarUrl: null,
        candidateProfile: null,
      },
      {
        id: 'cand-weak',
        fullName: 'Weak Dev',
        email: 'w@x.vn',
        phone: null,
        avatarUrl: null,
        candidateProfile: null,
      },
    ] as never);
    return setup;
  }

  it('returns [] when the semantic prefilter finds no candidates', async () => {
    const { service } = makeService(
      { candidatePrefilter: [] },
      { 'job-1': makeJob() },
    );
    await expect(service.recommendCandidatesForJob('job-1')).resolves.toEqual(
      [],
    );
  });

  it('throws NotFoundException for an unknown job', async () => {
    const { service } = makeService({}, {});
    await expect(service.recommendCandidatesForJob('nope')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('reranks prefiltered candidates by total score, descending', async () => {
    const { service } = makeRankedSetup();

    const ranked = await service.recommendCandidatesForJob('job-1');

    expect(ranked.map((r) => r.candidateId)).toEqual([
      'cand-strong',
      'cand-weak',
    ]);
    expect(ranked[0].totalScore).toBeGreaterThan(ranked[1].totalScore);
    expect(ranked[0].candidate.fullName).toBe('Strong Dev');
    expect(ranked[0].candidate.candidateProfile).toBeNull();
  });

  it('truncates the reranked list to the requested limit', async () => {
    const { service } = makeRankedSetup();
    const ranked = await service.recommendCandidatesForJob('job-1', 1);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].candidateId).toBe('cand-strong');
  });

  it('excludes candidates who are not open to work at the SQL level', async () => {
    // Regression guard: hiding is enforced in the prefilter query itself, so
    // hidden candidates never even reach scoring.
    const { service, ds } = makeRankedSetup();
    await service.recommendCandidatesForJob('job-1');

    const prefilterSql = ds.query.mock.calls
      .map((c) => c[0] as string)
      .find((sql) => sql.includes('FROM candidate_embeddings ce'))!;
    expect(prefilterSql).toContain('is_open_to_work = TRUE');
  });
});

describe('MatchingService.recommendJobsForCandidate', () => {
  it('returns [] when the semantic prefilter finds no jobs', async () => {
    const { service } = makeService({ jobPrefilter: [] }, {});
    await expect(service.recommendJobsForCandidate('cand-1')).resolves.toEqual(
      [],
    );
  });

  it('reranks prefiltered jobs by total score, descending', async () => {
    const jobs = {
      'job-good': makeJob({ id: 'job-good', requiredSkills: ['React'] }),
      'job-bad': makeJob({ id: 'job-bad', requiredSkills: ['Rust'] }),
    };
    const { service } = makeService(
      {
        skills: () => [{ name: 'react', is_verified: true }],
        similarity: (_cid, jid) => (jid === 'job-good' ? '0.9' : '0.3'),
        jobPrefilter: [{ job_id: 'job-bad' }, { job_id: 'job-good' }],
      },
      jobs,
    );

    const ranked = await service.recommendJobsForCandidate('cand-1');

    expect(ranked.map((r) => r.jobId)).toEqual(['job-good', 'job-bad']);
    expect(ranked[0].job.title).toBe('Backend Engineer');
    // Semantic is normalized PER CANDIDATE across the job pool {0.9, 0.3}:
    // job-good (max) -> 100, job-bad (min) -> 0.
    // job-good: keyword 100, semantic 100, verified 100 → 40 + 50 + 10
    expect(ranked[0].totalScore).toBe(100);
    // job-bad: react isn't required → all skill tiers 0, semantic 0 → 0
    expect(ranked[1].totalScore).toBe(0);
  });
});
