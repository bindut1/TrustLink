import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateProfile } from '../../database/entities/candidate-profile.entity';
import { CandidateSkill } from '../../database/entities/candidate-skill.entity';
import { Credential } from '../../database/entities/credential.entity';
import { Application } from '../../database/entities/application.entity';
import { User } from '../../database/entities/user.entity';
import { CredentialStatus, UserRole } from '../../database/enums';
import { EmbeddingService } from '../matching/embedding.service';
import { AddCandidateSkillDto } from './dto/add-candidate-skill.dto';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';
import { UpdateCandidateSkillDto } from './dto/update-candidate-skill.dto';

/** A candidate skill exposed to the owner (read-only). */
export interface CandidateSkillView {
  id: string;
  skillName: string;
  proficiencyLevel: string | null;
  isVerified: boolean;
  sourceCredentialId: string | null;
}

/**
 * Real profile-completeness (0–100) computed from the fields that are actually
 * filled — 11 equally-weighted signals. This replaces the previously static
 * `profile_completeness` column so the number reflects the live profile.
 */
export function computeProfileCompleteness(
  p: CandidateProfile,
  avatarUrl: string | null,
  skillCount: number,
): number {
  const locations = Array.isArray(p.preferredLocations)
    ? (p.preferredLocations as unknown[])
    : [];
  const checks: boolean[] = [
    !!avatarUrl,
    !!p.bio,
    !!p.dateOfBirth,
    !!p.gender,
    p.yearsOfExperience != null && p.yearsOfExperience > 0,
    !!p.desiredPosition,
    p.desiredSalaryMin != null || p.desiredSalaryMax != null,
    locations.length > 0,
    !!p.resumeUrl,
    !!(p.linkedinUrl || p.githubUrl || p.portfolioUrl),
    skillCount > 0,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

/** Aggregate counts powering the candidate dashboard. */
export interface CandidateDashboard {
  credentials: {
    total: number;
    onChain: number;
    byCategory: { category: string; count: number }[];
  };
  applications: {
    total: number;
    byStatus: { status: string; count: number }[];
  };
  profile: {
    completeness: number;
    isOpenToWork: boolean;
  };
}

@Injectable()
export class CandidateProfilesService {
  private readonly logger = new Logger(CandidateProfilesService.name);

  constructor(
    @InjectRepository(CandidateProfile)
    private readonly repo: Repository<CandidateProfile>,
    @InjectRepository(CandidateSkill)
    private readonly skillRepo: Repository<CandidateSkill>,
    @InjectRepository(Credential)
    private readonly credentialRepo: Repository<Credential>,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    private readonly embeddings: EmbeddingService,
  ) {}

  async findById(id: string, requester?: User): Promise<CandidateProfile> {
    // Explicitly selecting user fields keeps `passwordHash` out of the API
    // response while still allowing callers to render the candidate's name.
    const profile = await this.repo
      .createQueryBuilder('p')
      .leftJoin('p.user', 'u')
      .addSelect(['u.id', 'u.email', 'u.fullName', 'u.avatarUrl'])
      .where('p.id = :id', { id })
      .getOne();
    if (!profile) throw new NotFoundException('Candidate profile not found');
    this.assertVisibleTo(profile, requester);
    return this.withCompleteness(profile);
  }

  /**
   * A candidate who turned off "open to work" is hidden from everyone except
   * themselves, admins and issuers (issuers must still find candidates to
   * issue credentials to). Recruiters get a 403 even for submitted
   * applications — hiding is absolute by product decision.
   */
  private assertVisibleTo(profile: CandidateProfile, requester?: User): void {
    if (profile.isOpenToWork) return;
    if (!requester) return; // internal call, no access context
    const isOwner = requester.id === profile.userId;
    const exempt =
      requester.role === UserRole.ADMIN || requester.role === UserRole.ISSUER;
    if (!isOwner && !exempt) {
      throw new ForbiddenException('Candidate has hidden their profile');
    }
  }

  async findByUserId(userId: string): Promise<CandidateProfile> {
    const profile = await this.repo
      .createQueryBuilder('p')
      .leftJoin('p.user', 'u')
      .addSelect(['u.id', 'u.email', 'u.fullName', 'u.avatarUrl'])
      .where('p.userId = :userId', { userId })
      .getOne();
    if (!profile) throw new NotFoundException('Candidate profile not found');
    return this.withCompleteness(profile);
  }

  /**
   * Compute live completeness from the real fields and set it on the returned
   * profile. Not persisted here — reads stay side-effect free; the column is
   * refreshed on save (`updateByUserId`).
   */
  private async withCompleteness(
    profile: CandidateProfile,
  ): Promise<CandidateProfile> {
    const skillCount = await this.skillRepo.count({
      where: { candidateId: profile.userId },
    });
    profile.profileCompleteness = computeProfileCompleteness(
      profile,
      profile.user?.avatarUrl ?? null,
      skillCount,
    );
    return profile;
  }

  async updateByUserId(
    userId: string,
    dto: UpdateCandidateProfileDto,
  ): Promise<CandidateProfile> {
    const profile = await this.findByUserId(userId);
    Object.assign(profile, dto);
    // Recompute from the merged result and persist the fresh value.
    const skillCount = await this.skillRepo.count({
      where: { candidateId: userId },
    });
    profile.profileCompleteness = computeProfileCompleteness(
      profile,
      profile.user?.avatarUrl ?? null,
      skillCount,
    );
    const saved = await this.repo.save(profile);

    // Bio + desired_position feed into the embedding source text, so refresh
    // when those change.
    await this.refreshEmbedding(userId);

    return saved;
  }

  /**
   * Re-derive the candidate's matching embedding after profile/skill changes.
   * Best-effort: AI-service downtime must never block the candidate's write.
   */
  private async refreshEmbedding(userId: string): Promise<void> {
    try {
      await this.embeddings.updateCandidateEmbedding(userId);
    } catch (err) {
      this.logger.warn(
        `Failed to refresh embedding for candidate ${userId}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Read-only list of the candidate's skills, verified-first then alphabetical.
   * `isVerified` means the skill is backed by an on-chain credential
   * (`source_credential_id`).
   */
  async findSkillsByUserId(userId: string): Promise<CandidateSkillView[]> {
    const skills = await this.skillRepo.find({
      where: { candidateId: userId },
      order: { isVerified: 'DESC', skillName: 'ASC' },
    });
    return skills.map((s) => this.toSkillView(s));
  }

  private toSkillView(s: CandidateSkill): CandidateSkillView {
    return {
      id: s.id,
      skillName: s.skillName,
      proficiencyLevel: s.proficiencyLevel,
      isVerified: s.isVerified,
      sourceCredentialId: s.sourceCredentialId,
    };
  }

  /**
   * Candidate self-declares a skill on their own profile. Stored unverified
   * (`is_verified = false`, `source_credential_id = null`). It auto-promotes to
   * verified only if an issuer later anchors a credential covering the same
   * normalized skill (see CredentialsService.upsertCandidateSkills).
   *
   * Normalization mirrors the credential skill-extractor and the matching
   * keyword tier EXACTLY (lower + trim, no catalog alias expansion) so a
   * self-declared skill shares the same match key as required skills.
   */
  async addSkill(
    userId: string,
    dto: AddCandidateSkillDto,
  ): Promise<CandidateSkillView> {
    // Scope to candidates: findByUserId throws NotFound for non-candidate users.
    await this.findByUserId(userId);

    const skillName = dto.skillName.trim();
    const normalized = skillName.toLowerCase();
    if (!normalized) {
      throw new BadRequestException('Skill name must not be empty');
    }

    const existing = await this.skillRepo.findOne({
      where: { candidateId: userId, skillNameNormalized: normalized },
    });
    if (existing) {
      throw new ConflictException('You already have this skill');
    }

    const saved = await this.skillRepo.save(
      this.skillRepo.create({
        candidateId: userId,
        skillName,
        skillNameNormalized: normalized,
        proficiencyLevel: dto.proficiencyLevel?.trim() || null,
        isVerified: false,
        isSelfDeclared: true,
        sourceCredentialId: null,
      }),
    );

    await this.refreshEmbedding(userId);
    return this.toSkillView(saved);
  }

  /**
   * Edit a self-declared skill (name and/or proficiency). Credential-backed
   * skills are managed by the issuer and cannot be edited here. Renaming
   * re-normalizes and is rejected if it collides with another of the
   * candidate's skills.
   */
  async updateSkill(
    userId: string,
    skillId: string,
    dto: UpdateCandidateSkillDto,
  ): Promise<CandidateSkillView> {
    const skill = await this.skillRepo.findOne({
      where: { id: skillId, candidateId: userId },
    });
    if (!skill) {
      throw new NotFoundException('Skill not found');
    }
    if (skill.isVerified) {
      throw new ForbiddenException(
        'Cannot edit a verified skill; it is managed by the issuer',
      );
    }

    let nameChanged = false;
    if (dto.skillName !== undefined) {
      const skillName = dto.skillName.trim();
      const normalized = skillName.toLowerCase();
      if (!normalized) {
        throw new BadRequestException('Skill name must not be empty');
      }
      if (normalized !== skill.skillNameNormalized) {
        const clash = await this.skillRepo.findOne({
          where: { candidateId: userId, skillNameNormalized: normalized },
        });
        if (clash) {
          throw new ConflictException('You already have this skill');
        }
        skill.skillName = skillName;
        skill.skillNameNormalized = normalized;
        nameChanged = true;
      }
    }
    if (dto.proficiencyLevel !== undefined) {
      skill.proficiencyLevel = dto.proficiencyLevel.trim() || null;
    }

    const saved = await this.skillRepo.save(skill);
    // Only the skill NAME feeds the embedding source text; proficiency does not.
    if (nameChanged) await this.refreshEmbedding(userId);
    return this.toSkillView(saved);
  }

  /**
   * Remove a self-declared skill. Credential-backed skills
   * (`source_credential_id` set) are managed by issuance/revocation and cannot
   * be deleted here.
   */
  async removeSkill(userId: string, skillId: string): Promise<void> {
    const skill = await this.skillRepo.findOne({
      where: { id: skillId, candidateId: userId },
    });
    if (!skill) {
      throw new NotFoundException('Skill not found');
    }
    // Deletability is driven by verification, NOT by source_credential_id: a
    // skill that is not verified on-chain (self-declared, pending, or a leftover
    // from a revoked credential) is the candidate's own claim and can be
    // removed; a verified skill is managed by the issuer.
    if (skill.isVerified) {
      throw new ForbiddenException(
        'Cannot remove a verified skill; it is managed by the issuer',
      );
    }

    await this.skillRepo.delete({ id: skillId });
    await this.refreshEmbedding(userId);
  }

  /**
   * Dashboard aggregates for the current candidate. All counts are real DB
   * aggregations scoped to the candidate — no synthetic data.
   */
  async getDashboard(userId: string): Promise<CandidateDashboard> {
    const [
      credTotal,
      onChain,
      byCategoryRows,
      appTotal,
      byStatusRows,
      profile,
    ] = await Promise.all([
      this.credentialRepo.count({ where: { candidateId: userId } }),
      this.credentialRepo
        .createQueryBuilder('c')
        .where('c.candidateId = :userId', { userId })
        .andWhere('c.blockchainTxHash IS NOT NULL')
        .andWhere('c.status != :revoked', {
          revoked: CredentialStatus.REVOKED,
        })
        .getCount(),
      this.credentialRepo
        .createQueryBuilder('c')
        .leftJoin('c.credentialType', 'ct')
        .select('ct.category', 'category')
        .addSelect('COUNT(*)', 'count')
        .where('c.candidateId = :userId', { userId })
        .groupBy('ct.category')
        .getRawMany<{ category: string | null; count: string }>(),
      this.applicationRepo.count({ where: { candidateId: userId } }),
      this.applicationRepo
        .createQueryBuilder('a')
        .select('a.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('a.candidateId = :userId', { userId })
        .groupBy('a.status')
        .getRawMany<{ status: string; count: string }>(),
      // findByUserId computes live completeness from the real fields.
      this.findByUserId(userId).catch(() => null),
    ]);

    return {
      credentials: {
        total: credTotal,
        onChain,
        byCategory: byCategoryRows
          .filter((r) => r.category)
          .map((r) => ({ category: r.category as string, count: Number(r.count) })),
      },
      applications: {
        total: appTotal,
        byStatus: byStatusRows.map((r) => ({
          status: r.status,
          count: Number(r.count),
        })),
      },
      profile: {
        completeness: profile?.profileCompleteness ?? 0,
        isOpenToWork: profile?.isOpenToWork ?? false,
      },
    };
  }
}
