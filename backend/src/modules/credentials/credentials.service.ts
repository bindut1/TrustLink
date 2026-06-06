import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ethers } from 'ethers';
import { DataSource, MoreThan, Repository } from 'typeorm';
import { CandidateSkill } from '../../database/entities/candidate-skill.entity';
import { CredentialType } from '../../database/entities/credential-type.entity';
import { Credential } from '../../database/entities/credential.entity';
import { Institution } from '../../database/entities/institution.entity';
import { User } from '../../database/entities/user.entity';
import { VerificationCache } from '../../database/entities/verification-cache.entity';
import {
  ApprovalStatus,
  CredentialStatus,
  NotificationType,
  UserRole,
  VerificationResult,
} from '../../database/enums';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { EIP712_PROOF_TYPE } from '../blockchain/eip712';
import { verifyProof } from '../blockchain/merkle';
import { VcService } from '../blockchain/vc.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { ListCredentialsQueryDto } from './dto/list-credentials.query.dto';
import { RevokeCredentialDto } from './dto/revoke-credential.dto';
import { StatusListService } from './status-list.service';
import { validateCredentialMetadata } from './helpers/metadata-validator';
import {
  ExtractedSkill,
  extractSkillsFromMetadata,
} from './helpers/skill-extractor';

export interface VerificationOutcome {
  result: VerificationResult;
  onChainVerified: boolean;
  vcSignatureValid: boolean;
  issuerAuthorized: boolean;
  contentIntegrityValid: boolean;
  details: Record<string, unknown>;
  cached: boolean;
}

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
    @InjectRepository(VerificationCache)
    private readonly verificationCacheRepo: Repository<VerificationCache>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
    private readonly blockchain: BlockchainService,
    private readonly vcService: VcService,
    private readonly auditLogs: AuditLogsService,
    private readonly statusList: StatusListService,
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

    // 5b. Check if a previous credential of the same type exists for this
    // candidate — determines whether to send ISSUED or REISSUED notification.
    const existingCredential = await this.credRepo.findOne({
      where: {
        candidateId: candidate.id,
        credentialTypeId: credentialType.id,
      },
    });

    // 6. Persist credential + candidate skills in a single transaction.
    const saved = await this.dataSource.transaction(async (manager) => {
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
      const persisted = await manager.save(credential);

      await this.upsertCandidateSkills(
        manager,
        candidate.id,
        persisted.id,
        skills,
      );

      return persisted;
    });

    // Assign a StatusList2021 slot so this credential can later be revoked
    // individually (bitstring check), independent of on-chain batch revocation.
    await this.statusList.assignEntry(saved.id);

    await this.blockchain.issueCredentialOnChain({
      credentialId: saved.id,
      initiatedBy: issuerUserId,
    });

    await this.notifications.create({
      userId: candidate.id,
      type: existingCredential
        ? NotificationType.CREDENTIAL_REISSUED
        : NotificationType.CREDENTIAL_ISSUED,
      title: existingCredential ? 'Cấp lại văn bằng' : 'Văn bằng mới',
      message: existingCredential
        ? `${institution.name} đã cấp lại văn bằng "${saved.title}" cho bạn.`
        : `${institution.name} đã cấp văn bằng "${saved.title}" cho bạn.`,
      referenceType: 'credential',
      referenceId: saved.id,
    });

    await this.auditLogs.record({
      userId: issuerUserId,
      action: 'credential.issue',
      entityType: 'credential',
      entityId: saved.id,
      newValues: {
        credentialNumber: saved.credentialNumber,
        title: saved.title,
        candidateId: saved.candidateId,
        institutionId: saved.institutionId,
      },
    });

    return saved;
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
      relations: ['institution', 'credentialType', 'candidate'],
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
    const saved = await this.credRepo.save(credential);

    // Flip the StatusList2021 bit immediately so verification reflects the
    // revocation even before the on-chain batch revoke (if any) lands.
    await this.statusList.revokeByCredential(saved.id);

    await this.blockchain.revokeCredentialOnChain({
      credentialId: saved.id,
      initiatedBy: issuerUserId,
    });

    if (saved.candidateId) {
      await this.notifications.create({
        userId: saved.candidateId,
        type: NotificationType.CREDENTIAL_REVOKED,
        title: 'Văn bằng bị thu hồi',
        message: `Văn bằng "${saved.title}" của bạn đã bị thu hồi${
          dto.reason ? `: ${dto.reason}` : ''
        }.`,
        referenceType: 'credential',
        referenceId: saved.id,
      });
    }

    await this.auditLogs.record({
      userId: issuerUserId,
      action: 'credential.revoke',
      entityType: 'credential',
      entityId: saved.id,
      newValues: { reason: dto.reason },
    });

    return saved;
  }

  /**
   * Return the W3C VC payload for download. Both the JWT and the JSON form
   * are included; the JWT is the authoritative signed artifact.
   */
  async getVc(id: string): Promise<{
    vc_jwt: string;
    vc_json: Record<string, unknown>;
    issuer_did: string;
  }> {
    const credential = await this.credRepo.findOne({ where: { id } });
    if (!credential) throw new NotFoundException('Credential not found');
    if (!credential.vcJwt || !credential.vcJson || !credential.issuerDid) {
      throw new BadRequestException(
        'VC has not been issued for this credential yet',
      );
    }
    return {
      vc_jwt: credential.vcJwt,
      vc_json: credential.vcJson,
      issuer_did: credential.issuerDid,
    };
  }

  /**
   * 1-click verification: cache lookup → on-chain check → VC signature →
   * issuer authorization. Caches the composite result with a configurable TTL.
   */
  async verify(
    id: string,
    verifierUserId?: string,
  ): Promise<VerificationOutcome> {
    const credential = await this.credRepo.findOne({ where: { id } });
    if (!credential) throw new NotFoundException('Credential not found');
    if (!credential.credentialHash) {
      throw new BadRequestException(
        'Credential has not been hashed yet — cannot verify',
      );
    }

    const cached = await this.verificationCacheRepo.findOne({
      where: {
        credentialId: id,
        expiresAt: MoreThan(new Date()),
      },
      order: { verifiedAt: 'DESC' },
    });
    if (cached) {
      return {
        result: cached.result,
        onChainVerified: cached.onChainVerified,
        vcSignatureValid: cached.vcSignatureValid,
        issuerAuthorized: cached.issuerAuthorized,
        contentIntegrityValid: cached.contentIntegrityValid,
        details: cached.verificationDetails,
        cached: true,
      };
    }

    const outcome = await this.computeVerification(credential);

    const ttlSeconds = parseInt(
      this.config.get<string>('VERIFICATION_CACHE_TTL_SECONDS', '3600'),
      10,
    );
    const expiresAt = new Date(
      Date.now() + (Number.isFinite(ttlSeconds) ? ttlSeconds : 3600) * 1000,
    );

    await this.verificationCacheRepo.save(
      this.verificationCacheRepo.create({
        credentialId: credential.id,
        credentialHash: credential.credentialHash,
        result: outcome.result,
        onChainVerified: outcome.onChainVerified,
        vcSignatureValid: outcome.vcSignatureValid,
        issuerAuthorized: outcome.issuerAuthorized,
        contentIntegrityValid: outcome.contentIntegrityValid,
        verificationDetails: outcome.details,
        verifiedBy: verifierUserId ?? null,
        verifiedAt: new Date(),
        expiresAt,
      }),
    );

    return { ...outcome, cached: false };
  }

  private async computeVerification(
    credential: Credential,
  ): Promise<Omit<VerificationOutcome, 'cached'>> {
    const details: Record<string, unknown> = {};
    const isBatch = !!credential.merkleRoot;

    // Content integrity: recompute the hash from CURRENT content. Batch
    // credentials must prove the leaf belongs to the anchored Merkle root;
    // legacy per-credential anchoring compares against the stored hash. Either
    // way, tampering changes the leaf and breaks verification.
    const recomputedHash = this.blockchain.computeCredentialHash(credential);
    let contentIntegrityValid: boolean;
    if (isBatch) {
      contentIntegrityValid =
        Array.isArray(credential.merkleProof) &&
        verifyProof(
          recomputedHash,
          credential.merkleProof,
          credential.merkleRoot!,
        );
      details.contentIntegrity = {
        mode: 'merkle',
        valid: contentIntegrityValid,
        leaf: recomputedHash,
        merkleRoot: credential.merkleRoot,
        hashVersion: credential.hashVersion ?? 'legacy',
      };
    } else {
      contentIntegrityValid = recomputedHash === credential.credentialHash;
      details.contentIntegrity = {
        mode: 'direct',
        valid: contentIntegrityValid,
        recomputedHash,
        storedHash: credential.credentialHash,
        hashVersion: credential.hashVersion ?? 'legacy',
      };
    }

    // VC signature: EthereumEip712Signature2021 (non-custodial MetaMask) or the
    // legacy did-jwt JWS, chosen by the stored proof type.
    let vcSignatureValid = false;
    const proofType = (
      credential.vcJson as { proof?: { type?: string } } | null
    )?.proof?.type;
    if (proofType === EIP712_PROOF_TYPE) {
      const v = this.vcService.verifyEip712(credential.vcJson);
      vcSignatureValid = v.valid;
      details.vc = {
        type: 'eip712',
        valid: v.valid,
        signerAddress: v.signerAddress,
        issuerDid: v.issuerDid,
        ...(v.error ? { error: v.error } : {}),
      };
    } else if (credential.vcJwt) {
      const v = await this.vcService.verifyJwt(credential.vcJwt);
      vcSignatureValid = v.valid;
      details.vc = {
        type: 'jwt',
        valid: v.valid,
        issuerDid: v.issuerDid,
        signerAddress: v.signerAddress,
        ...(v.error ? { error: v.error } : {}),
      };
    } else {
      details.vc = { valid: false, error: 'No VC proof on credential' };
    }

    let onChainVerified = false;
    let onChainIssuer: string | null = null;
    let onChainRevoked = false;
    let onChainExists = false;
    try {
      const onChain = isBatch
        ? await this.blockchain.verifyBatchOnChain(credential.merkleRoot!)
        : await this.blockchain.verifyCredentialOnChain(recomputedHash);
      onChainExists = onChain.exists;
      onChainIssuer = onChain.issuer;
      onChainRevoked = onChain.isRevoked;
      onChainVerified = onChain.exists && !onChain.isRevoked;
      details.onChain = {
        mode: isBatch ? 'batch' : 'direct',
        exists: onChain.exists,
        issuer: onChain.issuer,
        timestamp: onChain.timestamp,
        isRevoked: onChain.isRevoked,
      };
    } catch (err) {
      // T1.4 — infrastructure failure (RPC down) is ERROR, distinct from a
      // data-level INVALID. Callers/UI must surface "cannot verify right now"
      // rather than "not authentic".
      details.onChainError = (err as Error).message;
      return {
        result: VerificationResult.ERROR,
        onChainVerified: false,
        vcSignatureValid: false,
        issuerAuthorized: false,
        contentIntegrityValid,
        details,
      };
    }

    let issuerAuthorized = false;
    if (onChainIssuer && onChainIssuer !== ethers.ZeroAddress) {
      issuerAuthorized = await this.blockchain.isIssuerAuthorized(onChainIssuer);
      details.issuerAuthorization = {
        address: onChainIssuer,
        authorized: issuerAuthorized,
      };
    }

    // T1.3 + T2.4 — a credential revoked in our DB or via its StatusList2021 bit
    // must never verify as VALID, even if the on-chain revoke hasn't landed.
    const dbRevoked = credential.status === CredentialStatus.REVOKED;
    const statusListRevoked = await this.statusList.isRevoked(credential.id);
    if (dbRevoked !== onChainRevoked || statusListRevoked !== onChainRevoked) {
      details.revocationDivergence = {
        dbRevoked,
        onChainRevoked,
        statusListRevoked,
      };
    }

    let result: VerificationResult;
    if (!onChainExists) {
      result = VerificationResult.NOT_FOUND;
    } else if (onChainRevoked || dbRevoked || statusListRevoked) {
      result = VerificationResult.REVOKED;
    } else if (
      onChainVerified &&
      vcSignatureValid &&
      issuerAuthorized &&
      contentIntegrityValid
    ) {
      result = VerificationResult.VALID;
    } else {
      result = VerificationResult.INVALID;
    }

    return {
      result,
      onChainVerified,
      vcSignatureValid,
      issuerAuthorized,
      contentIntegrityValid,
      details,
    };
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
