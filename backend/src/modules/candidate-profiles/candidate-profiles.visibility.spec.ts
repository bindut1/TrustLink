import { ForbiddenException } from '@nestjs/common';
import { User } from '../../database/entities/user.entity';
import { UserRole } from '../../database/enums';
import { CandidateProfilesService } from './candidate-profiles.service';

/**
 * Visibility rules for `GET /candidate-profiles/:id`: a candidate who turned
 * off "open to work" is hidden from recruiters (absolute — even with a
 * submitted application), while the owner, admins and issuers keep access.
 */
function makeService(profile: Record<string, unknown> | null) {
  const qb = {
    leftJoin: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(profile),
  };
  const repo = { createQueryBuilder: jest.fn(() => qb) };
  const skillRepo = { count: jest.fn().mockResolvedValue(0) };
  return new CandidateProfilesService(
    repo as never,
    skillRepo as never,
    {} as never,
    {} as never,
    {} as never,
  );
}

function hiddenProfile() {
  return {
    id: 'profile-1',
    userId: 'cand-1',
    isOpenToWork: false,
    preferredLocations: [],
    user: { avatarUrl: null },
  };
}

const asUser = (id: string, role: UserRole) => ({ id, role }) as User;

describe('CandidateProfilesService.findById — hidden profile', () => {
  it('blocks recruiters', async () => {
    const service = makeService(hiddenProfile());
    await expect(
      service.findById('profile-1', asUser('rec-1', UserRole.RECRUITER)),
    ).rejects.toThrow(ForbiddenException);
  });

  it('blocks other candidates', async () => {
    const service = makeService(hiddenProfile());
    await expect(
      service.findById('profile-1', asUser('other-cand', UserRole.CANDIDATE)),
    ).rejects.toThrow('Candidate has hidden their profile');
  });

  it('allows the owner', async () => {
    const service = makeService(hiddenProfile());
    await expect(
      service.findById('profile-1', asUser('cand-1', UserRole.CANDIDATE)),
    ).resolves.toMatchObject({ id: 'profile-1' });
  });

  it.each([UserRole.ADMIN, UserRole.ISSUER])('allows %s', async (role) => {
    const service = makeService(hiddenProfile());
    await expect(
      service.findById('profile-1', asUser('staff-1', role)),
    ).resolves.toMatchObject({ id: 'profile-1' });
  });

  it('allows everyone when the candidate is open to work', async () => {
    const service = makeService({ ...hiddenProfile(), isOpenToWork: true });
    await expect(
      service.findById('profile-1', asUser('rec-1', UserRole.RECRUITER)),
    ).resolves.toMatchObject({ id: 'profile-1' });
  });
});
