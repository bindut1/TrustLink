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

export interface CandidateSkillView {
  id: string;
  skillName: string;
  proficiencyLevel: string | null;
  isVerified: boolean;
  sourceCredentialId: string | null;
}

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

  private assertVisibleTo(profile: CandidateProfile, requester?: User): void {
    if (profile.isOpenToWork) return;
    if (!requester) return;
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
    const skillCount = await this.skillRepo.count({
      where: { candidateId: userId },
    });
    profile.profileCompleteness = computeProfileCompleteness(
      profile,
      profile.user?.avatarUrl ?? null,
      skillCount,
    );
    const saved = await this.repo.save(profile);

    await this.refreshEmbedding(userId);

    return saved;
  }

  private async refreshEmbedding(userId: string): Promise<void> {
    try {
      await this.embeddings.updateCandidateEmbedding(userId);
    } catch (err) {
      this.logger.warn(
        `Failed to refresh embedding for candidate ${userId}: ${(err as Error).message}`,
      );
    }
  }

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

  async addSkill(
    userId: string,
    dto: AddCandidateSkillDto,
  ): Promise<CandidateSkillView> {
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
    if (nameChanged) await this.refreshEmbedding(userId);
    return this.toSkillView(saved);
  }

  async removeSkill(userId: string, skillId: string): Promise<void> {
    const skill = await this.skillRepo.findOne({
      where: { id: skillId, candidateId: userId },
    });
    if (!skill) {
      throw new NotFoundException('Skill not found');
    }
    if (skill.isVerified) {
      throw new ForbiddenException(
        'Cannot remove a verified skill; it is managed by the issuer',
      );
    }

    await this.skillRepo.delete({ id: skillId });
    await this.refreshEmbedding(userId);
  }

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
      this.findByUserId(userId).catch(() => null),
    ]);

    return {
      credentials: {
        total: credTotal,
        onChain,
        byCategory: byCategoryRows
          .filter((r) => r.category)
          .map((r) => ({
            category: r.category as string,
            count: Number(r.count),
          })),
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
