import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import {
  ApplicationStatus,
  JobStatus,
  NotificationType,
  UserRole,
} from '../../database/enums';
import { ApplicationsService } from './applications.service';

function makeMocks() {
  const repo = {
    create: jest.fn((d: Record<string, unknown>) => d),
    save: jest.fn((d: { id?: string }) => {
      d.id ??= 'app-1';
      return Promise.resolve(d);
    }),
    find: jest.fn(() => Promise.resolve([])),
    findOne: jest.fn(() => Promise.resolve(null)),
    createQueryBuilder: jest.fn(),
  };
  const jobRepo = { findOne: jest.fn(() => Promise.resolve(null)) };
  const notifications = { create: jest.fn(() => Promise.resolve(undefined)) };
  const matching = {
    calculateScore: jest.fn(() =>
      Promise.resolve({
        totalScore: 62.5,
        keywordScore: 50,
        semanticScore: 80,
        verifiedBonus: 25,
      }),
    ),
  };
  const service = new ApplicationsService(
    repo as never,
    jobRepo as never,
    notifications as never,
    matching as never,
  );
  return { service, repo, jobRepo, notifications, matching };
}

const candidate = {
  id: 'cand-1',
  role: UserRole.CANDIDATE,
  fullName: 'Nguyen Van A',
} as User;

const openJob = {
  id: 'job-1',
  title: 'Backend Engineer',
  status: JobStatus.OPEN,
  recruiterId: 'rec-1',
};

describe('ApplicationsService.create', () => {
  const dto = { jobId: 'job-1' };

  it('rejects non-candidates', async () => {
    const m = makeMocks();
    await expect(
      m.service.create({ ...candidate, role: UserRole.RECRUITER } as User, dto),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects an unknown job', async () => {
    const m = makeMocks();
    await expect(m.service.create(candidate, dto)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects a job that is not open', async () => {
    const m = makeMocks();
    m.jobRepo.findOne.mockResolvedValue({
      ...openJob,
      status: JobStatus.CLOSED,
    } as never);
    await expect(m.service.create(candidate, dto)).rejects.toThrow(
      'Job is not open for applications',
    );
  });

  it('snapshots the match score and notifies the recruiter', async () => {
    const m = makeMocks();
    m.jobRepo.findOne.mockResolvedValue(openJob as never);

    const saved = (await m.service.create(candidate, dto)) as unknown as {
      matchScore: string;
      scoreBreakdown: { totalScore: number };
      status: ApplicationStatus;
    };

    expect(saved.matchScore).toBe('62.50');
    expect(saved.scoreBreakdown.totalScore).toBe(62.5);
    expect(saved.status).toBe(ApplicationStatus.APPLIED);
    expect(m.notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'rec-1',
        type: NotificationType.APPLICATION_RECEIVED,
        message: expect.stringContaining('Backend Engineer'),
      }),
    );
  });

  it('still creates the application when scoring fails (null scores)', async () => {
    const m = makeMocks();
    m.jobRepo.findOne.mockResolvedValue(openJob as never);
    m.matching.calculateScore.mockRejectedValue(new Error('AI service down'));

    const saved = (await m.service.create(candidate, dto)) as unknown as {
      matchScore: string | null;
      scoreBreakdown: Record<string, unknown>;
    };

    expect(saved.matchScore).toBeNull();
    expect(saved.scoreBreakdown).toEqual({});
    expect(m.notifications.create).toHaveBeenCalled();
  });

  it('maps the unique-constraint violation to "Already applied"', async () => {
    const m = makeMocks();
    m.jobRepo.findOne.mockResolvedValue(openJob as never);
    const dup = new QueryFailedError('INSERT', [], new Error('duplicate'));
    (dup as QueryFailedError & { code?: string }).code = '23505';
    m.repo.save.mockRejectedValue(dup);

    await expect(m.service.create(candidate, dto)).rejects.toThrow(
      ConflictException,
    );
  });

  it('rethrows other database errors untouched', async () => {
    const m = makeMocks();
    m.jobRepo.findOne.mockResolvedValue(openJob as never);
    m.repo.save.mockRejectedValue(new Error('connection lost'));

    await expect(m.service.create(candidate, dto)).rejects.toThrow(
      'connection lost',
    );
  });
});

describe('ApplicationsService.findForJob', () => {
  it('rejects an unknown job', async () => {
    const m = makeMocks();
    await expect(m.service.findForJob('job-1', 'rec-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects a recruiter who does not own the job', async () => {
    const m = makeMocks();
    m.jobRepo.findOne.mockResolvedValue(openJob as never);
    await expect(m.service.findForJob('job-1', 'intruder')).rejects.toThrow(
      'Not the owner of this job',
    );
  });

  it('returns applications sorted by match score, nulls last', async () => {
    const m = makeMocks();
    m.jobRepo.findOne.mockResolvedValue(openJob as never);
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(['app-a', 'app-b']),
    };
    m.repo.createQueryBuilder.mockReturnValue(qb as never);

    const result = await m.service.findForJob('job-1', 'rec-1');

    expect(result).toEqual(['app-a', 'app-b']);
    expect(qb.orderBy).toHaveBeenCalledWith(
      'application.match_score',
      'DESC',
      'NULLS LAST',
    );
  });
});

describe('ApplicationsService.updateStatus', () => {
  function application(overrides: Record<string, unknown> = {}) {
    return {
      id: 'app-1',
      candidateId: 'cand-1',
      status: ApplicationStatus.APPLIED,
      statusChangedAt: new Date(0),
      recruiterNotes: null,
      job: { ...openJob },
      ...overrides,
    };
  }

  it('rejects an unknown application', async () => {
    const m = makeMocks();
    await expect(
      m.service.updateStatus('app-1', 'rec-1', {
        status: ApplicationStatus.REVIEWING,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects a recruiter who does not own the job', async () => {
    const m = makeMocks();
    m.repo.findOne.mockResolvedValue(application() as never);
    await expect(
      m.service.updateStatus('app-1', 'intruder', {
        status: ApplicationStatus.REVIEWING,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it.each([
    [ApplicationStatus.APPLIED, ApplicationStatus.OFFERED],
    [ApplicationStatus.APPLIED, ApplicationStatus.INTERVIEW],
    [ApplicationStatus.REJECTED, ApplicationStatus.REVIEWING], // terminal
    [ApplicationStatus.WITHDRAWN, ApplicationStatus.REVIEWING], // terminal
    [ApplicationStatus.OFFERED, ApplicationStatus.APPLIED], // no going back
  ])('rejects the illegal transition %s → %s', async (from, to) => {
    const m = makeMocks();
    m.repo.findOne.mockResolvedValue(application({ status: from }) as never);
    await expect(
      m.service.updateStatus('app-1', 'rec-1', { status: to }),
    ).rejects.toThrow(BadRequestException);
  });

  it.each([
    [ApplicationStatus.APPLIED, ApplicationStatus.REVIEWING],
    [ApplicationStatus.REVIEWING, ApplicationStatus.SHORTLISTED],
    [ApplicationStatus.SHORTLISTED, ApplicationStatus.INTERVIEW],
    [ApplicationStatus.INTERVIEW, ApplicationStatus.OFFERED],
    [ApplicationStatus.OFFERED, ApplicationStatus.REJECTED],
  ])('allows the pipeline transition %s → %s', async (from, to) => {
    const m = makeMocks();
    m.repo.findOne.mockResolvedValue(application({ status: from }) as never);

    const saved = await m.service.updateStatus('app-1', 'rec-1', {
      status: to,
    });

    expect(saved.status).toBe(to);
    expect(saved.statusChangedAt.getTime()).toBeGreaterThan(0);
  });

  it('notifies the candidate with the Vietnamese status label', async () => {
    const m = makeMocks();
    m.repo.findOne.mockResolvedValue(application() as never);

    await m.service.updateStatus('app-1', 'rec-1', {
      status: ApplicationStatus.REVIEWING,
    });

    expect(m.notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'cand-1',
        type: NotificationType.APPLICATION_STATUS_CHANGED,
        message: expect.stringContaining('Đang xem xét'),
      }),
    );
  });

  it('updates recruiter notes without a status change (no transition check)', async () => {
    const m = makeMocks();
    const app = application({ status: ApplicationStatus.REJECTED });
    m.repo.findOne.mockResolvedValue(app as never);

    const saved = await m.service.updateStatus('app-1', 'rec-1', {
      status: ApplicationStatus.REJECTED, // unchanged
      recruiterNotes: 'strong profile, keep for later',
    });

    expect(saved.status).toBe(ApplicationStatus.REJECTED);
    expect(saved.recruiterNotes).toBe('strong profile, keep for later');
  });
});
