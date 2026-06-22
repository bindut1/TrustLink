import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CandidateProfilesService } from './candidate-profiles.service';

/**
 * Self-declared skills: candidates add / edit / remove their own skills. Stored
 * unverified (source_credential_id = null, is_self_declared = true);
 * credential-backed skills cannot be edited or removed here. Normalization
 * mirrors the matching keyword tier (lower + trim).
 */
function makeService(opts: {
  profile?: Record<string, unknown> | null;
  findOne?: Array<Record<string, unknown> | null>;
}) {
  const qb = {
    leftJoin: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(
      opts.profile === undefined
        ? { id: 'p1', userId: 'cand-1', preferredLocations: [], user: {} }
        : opts.profile,
    ),
  };
  const repo = { createQueryBuilder: jest.fn(() => qb) };
  const findOne = jest.fn();
  for (const r of opts.findOne ?? [null]) findOne.mockResolvedValueOnce(r);
  const skillRepo = {
    count: jest.fn().mockResolvedValue(0),
    findOne,
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => ({ id: x.id ?? 'skill-1', ...x })),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  };
  const embeddings = {
    updateCandidateEmbedding: jest.fn().mockResolvedValue(undefined),
  };
  const service = new CandidateProfilesService(
    repo as never,
    skillRepo as never,
    {} as never,
    {} as never,
    embeddings as never,
  );
  return { service, skillRepo, embeddings };
}

describe('CandidateProfilesService.addSkill', () => {
  it('stores a self-declared skill: unverified, self_declared, normalized, source null', async () => {
    const { service, skillRepo, embeddings } = makeService({ findOne: [null] });
    const view = await service.addSkill('cand-1', { skillName: '  React  ' });

    expect(skillRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateId: 'cand-1',
        skillName: 'React',
        skillNameNormalized: 'react',
        isVerified: false,
        isSelfDeclared: true,
        sourceCredentialId: null,
      }),
    );
    expect(view).toMatchObject({ isVerified: false, sourceCredentialId: null });
    expect(embeddings.updateCandidateEmbedding).toHaveBeenCalledWith('cand-1');
  });

  it('rejects a duplicate skill (same normalized form)', async () => {
    const { service } = makeService({ findOne: [{ id: 's0' }] });
    await expect(
      service.addSkill('cand-1', { skillName: 'react' }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects when the user has no candidate profile', async () => {
    const { service } = makeService({ profile: null });
    await expect(
      service.addSkill('rec-1', { skillName: 'React' }),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('CandidateProfilesService.updateSkill', () => {
  const selfDeclared = {
    id: 'skill-1',
    candidateId: 'cand-1',
    skillName: 'React',
    skillNameNormalized: 'react',
    proficiencyLevel: null,
    isVerified: false,
    sourceCredentialId: null,
  };

  it('renames a self-declared skill and re-normalizes', async () => {
    // 1st findOne = the skill; 2nd findOne = clash check (none)
    const { service, skillRepo, embeddings } = makeService({
      findOne: [{ ...selfDeclared }, null],
    });
    const view = await service.updateSkill('cand-1', 'skill-1', {
      skillName: 'Vue',
    });
    expect(view).toMatchObject({ skillName: 'Vue' });
    expect(skillRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ skillName: 'Vue', skillNameNormalized: 'vue' }),
    );
    expect(embeddings.updateCandidateEmbedding).toHaveBeenCalledWith('cand-1');
  });

  it('rejects a rename that collides with another skill', async () => {
    const { service } = makeService({
      findOne: [{ ...selfDeclared }, { id: 'other' }],
    });
    await expect(
      service.updateSkill('cand-1', 'skill-1', { skillName: 'Node' }),
    ).rejects.toThrow(ConflictException);
  });

  it('updates proficiency only without refreshing the embedding', async () => {
    const { service, embeddings } = makeService({
      findOne: [{ ...selfDeclared }],
    });
    await service.updateSkill('cand-1', 'skill-1', {
      proficiencyLevel: 'Advanced',
    });
    expect(embeddings.updateCandidateEmbedding).not.toHaveBeenCalled();
  });

  it('refuses to edit a verified skill', async () => {
    const { service } = makeService({
      findOne: [{ ...selfDeclared, isVerified: true, sourceCredentialId: 'cred-1' }],
    });
    await expect(
      service.updateSkill('cand-1', 'skill-1', { skillName: 'Vue' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws when the skill does not exist', async () => {
    const { service } = makeService({ findOne: [null] });
    await expect(
      service.updateSkill('cand-1', 'nope', { skillName: 'Vue' }),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('CandidateProfilesService.removeSkill', () => {
  it('removes an unverified skill and refreshes the embedding', async () => {
    const { service, skillRepo, embeddings } = makeService({
      findOne: [
        {
          id: 'skill-1',
          candidateId: 'cand-1',
          isVerified: false,
          sourceCredentialId: null,
        },
      ],
    });
    await service.removeSkill('cand-1', 'skill-1');
    expect(skillRepo.delete).toHaveBeenCalledWith({ id: 'skill-1' });
    expect(embeddings.updateCandidateEmbedding).toHaveBeenCalledWith('cand-1');
  });

  it('removes a leftover (unverified) skill even if it still has a source credential', async () => {
    const { service, skillRepo } = makeService({
      findOne: [
        {
          id: 'skill-1',
          candidateId: 'cand-1',
          isVerified: false,
          sourceCredentialId: 'cred-1',
        },
      ],
    });
    await service.removeSkill('cand-1', 'skill-1');
    expect(skillRepo.delete).toHaveBeenCalledWith({ id: 'skill-1' });
  });

  it('refuses to remove a verified skill', async () => {
    const { service, skillRepo } = makeService({
      findOne: [
        { id: 'skill-1', candidateId: 'cand-1', isVerified: true },
      ],
    });
    await expect(service.removeSkill('cand-1', 'skill-1')).rejects.toThrow(
      ForbiddenException,
    );
    expect(skillRepo.delete).not.toHaveBeenCalled();
  });

  it('throws when the skill does not exist', async () => {
    const { service } = makeService({ findOne: [null] });
    await expect(service.removeSkill('cand-1', 'nope')).rejects.toThrow(
      NotFoundException,
    );
  });
});
