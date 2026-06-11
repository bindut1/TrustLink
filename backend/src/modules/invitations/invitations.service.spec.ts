import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../../database/entities/user.entity';
import { JobStatus, UserRole } from '../../database/enums';
import { InvitationsService } from './invitations.service';

function makeMocks() {
  const repo = {
    findOne: jest.fn(() => Promise.resolve(null)),
    create: jest.fn((d: unknown) => d),
    save: jest.fn((d: { id?: string }) => {
      d.id ??= 'invite-1';
      return Promise.resolve(d);
    }),
  };
  const jobRepo = { findOne: jest.fn(() => Promise.resolve(null)) };
  const userRepo = { findOne: jest.fn(() => Promise.resolve(null)) };
  const applicationRepo = { findOne: jest.fn(() => Promise.resolve(null)) };
  const notifications = { create: jest.fn(() => Promise.resolve(undefined)) };
  const service = new InvitationsService(
    repo as never,
    jobRepo as never,
    userRepo as never,
    applicationRepo as never,
    notifications as never,
  );
  return { service, repo, jobRepo, userRepo, applicationRepo, notifications };
}

const recruiter = { id: 'rec-1', fullName: 'Recruiter' } as User;
const openJob = {
  id: 'job-1',
  title: 'Backend Engineer',
  status: JobStatus.OPEN,
  recruiterId: 'rec-1',
  recruiter: { recruiterProfile: { companyName: 'ACME' } },
};

function candidate(isOpenToWork: boolean) {
  return {
    id: 'cand-1',
    role: UserRole.CANDIDATE,
    candidateProfile: { isOpenToWork },
  };
}

describe('InvitationsService.invite', () => {
  it('rejects inviting a candidate who hid their profile', async () => {
    const m = makeMocks();
    m.jobRepo.findOne.mockResolvedValue(openJob as never);
    m.userRepo.findOne.mockResolvedValue(candidate(false) as never);

    await expect(
      m.service.invite('job-1', 'cand-1', recruiter, {}),
    ).rejects.toThrow(ForbiddenException);
    expect(m.repo.save).not.toHaveBeenCalled();
  });

  it('invites an open-to-work candidate and notifies them', async () => {
    const m = makeMocks();
    m.jobRepo.findOne.mockResolvedValue(openJob as never);
    m.userRepo.findOne.mockResolvedValue(candidate(true) as never);

    const saved = await m.service.invite('job-1', 'cand-1', recruiter, {
      message: 'Join us!',
    });

    expect(saved.id).toBe('invite-1');
    expect(m.notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'cand-1',
        message: expect.stringContaining('ACME'),
      }),
    );
  });

  it('rejects when the recruiter does not own the job', async () => {
    const m = makeMocks();
    m.jobRepo.findOne.mockResolvedValue(
      { ...openJob, recruiterId: 'someone-else' } as never,
    );
    await expect(
      m.service.invite('job-1', 'cand-1', recruiter, {}),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects when the candidate already applied', async () => {
    const m = makeMocks();
    m.jobRepo.findOne.mockResolvedValue(openJob as never);
    m.userRepo.findOne.mockResolvedValue(candidate(true) as never);
    m.applicationRepo.findOne.mockResolvedValue({ id: 'app-1' } as never);

    await expect(
      m.service.invite('job-1', 'cand-1', recruiter, {}),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects an unknown candidate', async () => {
    const m = makeMocks();
    m.jobRepo.findOne.mockResolvedValue(openJob as never);
    await expect(
      m.service.invite('job-1', 'ghost', recruiter, {}),
    ).rejects.toThrow(NotFoundException);
  });
});
