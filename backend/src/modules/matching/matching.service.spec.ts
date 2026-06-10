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
        similarity: () => '0.8',
      },
      { 'job-1': makeJob() },
    );

    const score = await service.calculateScore('cand-1', 'job-1');

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
      { similarity: () => '0.6' },
      { 'job-1': makeJob({ requiredSkills: [] }) },
    );

    const score = await service.calculateScore('cand-1', 'job-1');

    expect(score.keywordScore).toBe(0);
    expect(score.verifiedBonus).toBe(0);
    expect(score.semanticScore).toBe(60);
    expect(score.totalScore).toBe(30); // 0.5 * 60
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
    // job-good: keyword 100, semantic 90, verified 100 → 40 + 45 + 10
    expect(ranked[0].totalScore).toBe(95);
    // job-bad: react isn't required → all skill tiers 0, semantic 30 → 15
    expect(ranked[1].totalScore).toBe(15);
  });
});
