import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CandidateSkill } from '../../database/entities/candidate-skill.entity';
import { CredentialType } from '../../database/entities/credential-type.entity';
import { Credential } from '../../database/entities/credential.entity';
import { Institution } from '../../database/entities/institution.entity';
import { User } from '../../database/entities/user.entity';
import {
  ApprovalStatus,
  CredentialStatus,
  UserRole,
} from '../../database/enums';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { ListCredentialsQueryDto } from './dto/list-credentials.query.dto';
import { RevokeCredentialDto } from './dto/revoke-credential.dto';
import { validateCredentialMetadata } from './helpers/metadata-validator';
import {
  ExtractedSkill,
  extractSkillsFromMetadata,
} from './helpers/skill-extractor';

@Injectable()
export class CredentialsService {
  constructor(
    @InjectRepository(Credential)
    private readonly credRepo: Repository<Credential>,
    @InjectRepository(CredentialType)
    private readonly typeRepo: Repository<CredentialType>,
    @InjectRepository(Institution)
    private readonly institutionRepo: Repository<Institution>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(CandidateSkill)
    private readonly skillRepo: Repository<CandidateSkill>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    issuerUserId: string,
    dto: CreateCredentialDto,
  ): Promise<Credential> {
    // 1. Issuer must have an approved institution.
    const institution = await this.institutionRepo.findOne({
      where: { userId: issuerUserId },
    });
    if (!institution) {
      throw new ForbiddenException('Issuer has no registered institution');
    }
    if (institution.approvalStatus !== ApprovalStatus.APPROVED) {
      throw new ForbiddenException('Institution is not approved');
    }

    // 2. Credential type must exist and be active.
    const credentialType = await this.typeRepo.findOne({
      where: { id: dto.credentialTypeId },
    });
    if (!credentialType) {
      throw new NotFoundException('Credential type not found');
    }
    if (!credentialType.isActive) {
      throw new BadRequestException('Credential type is inactive');
    }

    // 3. Candidate must exist and be a candidate role.
    const candidate = await this.userRepo.findOne({
      where: { id: dto.candidateId },
    });
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }
    if (candidate.role !== UserRole.CANDIDATE) {
      throw new BadRequestException('Target user is not a candidate');
    }

    // 4. Validate metadata against the credential type's field_schema.
    validateCredentialMetadata(dto.metadata, credentialType.fieldSchema);

    // 5. Extract skills from metadata.
    const skills = extractSkillsFromMetadata(
      dto.metadata,
      credentialType.fieldSchema,
    );

    // 6. Persist credential + candidate skills in a single transaction.
    return this.dataSource.transaction(async (manager) => {
      const credential = manager.create(Credential, {
        credentialNumber: dto.credentialNumber,
        credentialTypeId: credentialType.id,
        institutionId: institution.id,
        candidateId: candidate.id,
        title: dto.title,
        issuedDate: new Date(dto.issuedDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        metadata: dto.metadata,
        extractedSkills: skills.map((s) => s.name),
        status: CredentialStatus.PENDING,
      });
      const saved = await manager.save(credential);

      await this.upsertCandidateSkills(manager, candidate.id, saved.id, skills);

      return saved;
    });
  }

  async findAll(query: ListCredentialsQueryDto): Promise<Credential[]> {
    const where: Record<string, unknown> = {};
    if (query.institutionId) where.institutionId = query.institutionId;
    if (query.candidateId) where.candidateId = query.candidateId;
    if (query.status) where.status = query.status;
    if (query.credentialTypeId)
      where.credentialTypeId = query.credentialTypeId;

    return this.credRepo.find({
      where,
      relations: ['institution', 'credentialType'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMy(candidateId: string): Promise<Credential[]> {
    return this.credRepo.find({
      where: { candidateId },
      relations: ['institution', 'credentialType'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Credential> {
    const credential = await this.credRepo.findOne({
      where: { id },
      relations: ['institution', 'credentialType', 'candidate'],
    });
    if (!credential) throw new NotFoundException('Credential not found');
    return credential;
  }

  async revoke(
    id: string,
    issuerUserId: string,
    dto: RevokeCredentialDto,
  ): Promise<Credential> {
    const credential = await this.credRepo.findOne({ where: { id } });
    if (!credential) throw new NotFoundException('Credential not found');

    const institution = await this.institutionRepo.findOne({
      where: { userId: issuerUserId },
    });
    if (!institution || credential.institutionId !== institution.id) {
      throw new ForbiddenException(
        'Only the issuing institution can revoke this credential',
      );
    }

    if (credential.status === CredentialStatus.REVOKED) {
      throw new BadRequestException('Credential is already revoked');
    }

    credential.status = CredentialStatus.REVOKED;
    credential.revokedAt = new Date();
    credential.revocationReason = dto.reason;
    return this.credRepo.save(credential);
  }

  /**
   * Upsert candidate skills using the unique (candidate_id, skill_name_normalized)
   * constraint so repeated credentials don't create duplicate rows.
   */
  private async upsertCandidateSkills(
    manager: import('typeorm').EntityManager,
    candidateId: string,
    sourceCredentialId: string,
    skills: ExtractedSkill[],
  ): Promise<void> {
    if (skills.length === 0) return;

    const rows = skills.map((s) => ({
      candidateId,
      skillName: s.name,
      skillNameNormalized: s.normalized,
      sourceCredentialId,
      // Verified becomes true once the credential is confirmed on-chain; at
      // issue time status=pending, so keep it false.
      isVerified: false,
    }));

    await manager
      .createQueryBuilder()
      .insert()
      .into(CandidateSkill)
      .values(rows)
      .orUpdate(
        ['skill_name', 'source_credential_id', 'updated_at'],
        ['candidate_id', 'skill_name_normalized'],
      )
      .execute();
  }
}
