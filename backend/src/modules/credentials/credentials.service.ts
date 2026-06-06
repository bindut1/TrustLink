import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
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
import {
  BlockchainService,
  HASH_VERSION_CANONICAL,
} from '../blockchain/blockchain.service';
import {
  BATCH_EIP712_PRIMARY_TYPE,
  BatchTypedData,
  CredentialTypedData,
  EIP712_PROOF_TYPE,
} from '../blockchain/eip712';
import { buildMerkleTree, getProof, verifyProof } from '../blockchain/merkle';
import { VcService } from '../blockchain/vc.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  AnchorBatchDto,
  AnchorBulkDto,
  PrepareBatchDto,
} from './dto/batch.dto';
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
  private readonly logger = new Logger(CredentialsService.name);

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

  /**
   * Register the issuer institution's non-custodial MetaMask address. Used as
   * the issuer DID address (VC signer) and the on-chain batch sender.
   */
  async registerIssuerWallet(
    issuerUserId: string,
    signingAddress: string,
  ): Promise<{ signingAddress: string; authorized: boolean }> {
    const institution = await this.institutionRepo.findOne({
      where: { userId: issuerUserId },
    });
    if (!institution) {
      throw new ForbiddenException('Issuer has no registered institution');
    }
    institution.signingAddress = signingAddress.toLowerCase();
    await this.institutionRepo.save(institution);

    // Authorize this wallet on-chain so it can broadcast `issueBatch`. addIssuer
    // is owner-only; the platform (contract owner) sponsors this one-time tx —
    // the issuer still signs/sends their own credential batches afterwards.
    let authorized = false;
    if (this.blockchain.isReady()) {
      try {
        authorized = await this.blockchain.isIssuerAuthorized(
          institution.signingAddress,
        );
        if (!authorized) {
          await this.blockchain.addIssuerOnChain({
            institutionId: institution.id,
            address: institution.signingAddress,
            initiatedBy: issuerUserId,
          });
          authorized = true;
        }
      } catch (err) {
        this.logger.warn(
          `Could not authorize issuer wallet ${institution.signingAddress} on-chain: ${(err as Error).message}`,
        );
      }
    }
    return { signingAddress: institution.signingAddress, authorized };
  }

  /**
   * Phase 1 of non-custodial batch issuance: create the credentials (PENDING),
   * compute each canonical leaf hash, build the Merkle tree, persist
   * root/proof/index, and return the per-credential EIP-712 typed data for the
   * issuer's wallet to sign client-side.
   */
  async prepareBatch(
    issuerUserId: string,
    dto: PrepareBatchDto,
  ): Promise<{
    merkleRoot: string;
    items: { credentialId: string; typedData: CredentialTypedData }[];
    batchTypedData: BatchTypedData;
  }> {
    const institution = await this.institutionRepo.findOne({
      where: { userId: issuerUserId },
    });
    if (!institution) {
      throw new ForbiddenException('Issuer has no registered institution');
    }
    if (institution.approvalStatus !== ApprovalStatus.APPROVED) {
      throw new ForbiddenException('Institution is not approved');
    }
    if (!institution.signingAddress) {
      throw new BadRequestException(
        'Register the issuer signing wallet before issuing',
      );
    }

    const prepared: { credential: Credential; candidate: User }[] = [];
    await this.dataSource.transaction(async (manager) => {
      for (const item of dto.items) {
        const credentialType = await manager.findOne(CredentialType, {
          where: { id: item.credentialTypeId },
        });
        if (!credentialType) {
          throw new NotFoundException(
            `Credential type not found: ${item.credentialTypeId}`,
          );
        }
        if (!credentialType.isActive) {
          throw new BadRequestException('Credential type is inactive');
        }
        const candidate = await manager.findOne(User, {
          where: { id: item.candidateId },
        });
        if (!candidate) {
          throw new NotFoundException(
            `Candidate not found: ${item.candidateId}`,
          );
        }
        if (candidate.role !== UserRole.CANDIDATE) {
          throw new BadRequestException('Target user is not a candidate');
        }
        validateCredentialMetadata(item.metadata, credentialType.fieldSchema);
        const skills = extractSkillsFromMetadata(
          item.metadata,
          credentialType.fieldSchema,
        );

        // Idempotent: if a credential with the same (number, institution) is
        // still PENDING (a prior prepare that was never anchored), reuse it
        // instead of creating a duplicate. An already-issued one is a conflict.
        let credential = await manager.findOne(Credential, {
          where: {
            credentialNumber: item.credentialNumber,
            institutionId: institution.id,
          },
        });
        if (credential) {
          if (
            credential.status !== CredentialStatus.PENDING ||
            credential.blockchainTxHash
          ) {
            throw new ConflictException(
              `Credential ${item.credentialNumber} has already been issued`,
            );
          }
          credential.credentialTypeId = credentialType.id;
          credential.candidateId = candidate.id;
          credential.title = item.title;
          credential.issuedDate = new Date(item.issuedDate);
          credential.expiryDate = item.expiryDate
            ? new Date(item.expiryDate)
            : null;
          credential.metadata = item.metadata;
          credential.extractedSkills = skills.map((s) => s.name);
          credential.hashVersion = HASH_VERSION_CANONICAL;
        } else {
          credential = manager.create(Credential, {
            credentialNumber: item.credentialNumber,
            credentialTypeId: credentialType.id,
            institutionId: institution.id,
            candidateId: candidate.id,
            title: item.title,
            issuedDate: new Date(item.issuedDate),
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
            metadata: item.metadata,
            extractedSkills: skills.map((s) => s.name),
            status: CredentialStatus.PENDING,
            hashVersion: HASH_VERSION_CANONICAL,
          });
        }
        credential = await manager.save(credential);
        credential.credentialHash =
          this.blockchain.computeCredentialHash(credential);
        credential = await manager.save(credential);
        await this.upsertCandidateSkills(
          manager,
          candidate.id,
          credential.id,
          skills,
        );
        prepared.push({ credential, candidate });
      }
    });

    const tree = buildMerkleTree(
      prepared.map((p) => p.credential.credentialHash!),
    );
    for (let i = 0; i < prepared.length; i++) {
      const c = prepared[i].credential;
      c.merkleRoot = tree.root;
      c.leafIndex = i;
      c.merkleProof = getProof(tree, i);
      await this.credRepo.save(c);
    }

    return {
      merkleRoot: tree.root,
      items: prepared.map((p) => ({
        credentialId: p.credential.id,
        typedData: this.vcService.buildCredentialTypedData({
          credential: p.credential,
          institution,
          candidate: p.candidate,
        }),
      })),
      // Single typed-data the issuer signs ONCE to authorize the whole batch
      // (used by bulk issuance; the single-issue flow uses per-credential items).
      batchTypedData: this.vcService.buildBatchTypedData({
        merkleRoot: tree.root,
        institution,
        count: prepared.length,
        issuedAt: new Date().toISOString(),
      }),
    };
  }

  /**
   * Phase 2: after the issuer signed each VC and broadcast `issueBatch(root)`
   * from their own wallet, verify the signatures + on-chain anchor, then store
   * the signed VCs and mark the credentials issued.
   */
  async anchorBatch(
    issuerUserId: string,
    dto: AnchorBatchDto,
  ): Promise<{ anchored: number }> {
    const institution = await this.institutionRepo.findOne({
      where: { userId: issuerUserId },
    });
    if (!institution) {
      throw new ForbiddenException('Issuer has no registered institution');
    }
    if (!institution.signingAddress) {
      throw new BadRequestException('Register the issuer signing wallet first');
    }

    const creds = await this.credRepo.find({
      where: { merkleRoot: dto.merkleRoot, institutionId: institution.id },
    });
    if (creds.length === 0) {
      throw new NotFoundException(
        'No prepared credentials for this Merkle root',
      );
    }

    const ordered = creds
      .slice()
      .sort((a, b) => (a.leafIndex ?? 0) - (b.leafIndex ?? 0));
    const tree = buildMerkleTree(ordered.map((c) => c.credentialHash!));
    if (tree.root.toLowerCase() !== dto.merkleRoot.toLowerCase()) {
      throw new BadRequestException(
        'Merkle root does not match the prepared credentials',
      );
    }

    // The root must actually be anchored on-chain by THIS institution's wallet.
    const onChain = await this.blockchain.verifyBatchOnChain(dto.merkleRoot);
    if (!onChain.exists) {
      throw new BadRequestException('Merkle root is not anchored on-chain yet');
    }
    if (
      onChain.issuer.toLowerCase() !== institution.signingAddress.toLowerCase()
    ) {
      throw new ForbiddenException('Batch was anchored by a different address');
    }

    const sigMap = new Map(dto.signatures.map((s) => [s.credentialId, s.signature]));
    const createdAt = new Date().toISOString();
    let anchored = 0;
    for (const c of ordered) {
      const signature = sigMap.get(c.id);
      if (!signature) continue;
      const candidate = await this.userRepo.findOne({
        where: { id: c.candidateId! },
      });
      if (!candidate) continue;

      const typedData = this.vcService.buildCredentialTypedData({
        credential: c,
        institution,
        candidate,
      });
      const entry = await this.statusList.assignEntry(c.id);
      const vcJson = this.vcService.assembleEip712Vc({
        typedData,
        signature,
        candidate,
        institutionName: institution.name,
        createdAt,
      });
      (vcJson as Record<string, unknown>).credentialStatus =
        this.statusList.buildCredentialStatus(entry);

      const verified = this.vcService.verifyEip712(vcJson);
      if (
        !verified.valid ||
        verified.signerAddress?.toLowerCase() !==
          institution.signingAddress.toLowerCase()
      ) {
        throw new BadRequestException(
          `Invalid issuer signature for credential ${c.id}`,
        );
      }

      c.vcJson = vcJson;
      c.digitalSignature = signature;
      c.issuerDid = typedData.message.issuerDid;
      c.blockchainTxHash = dto.txHash;
      c.blockchainTimestamp = new Date(onChain.timestamp * 1000);
      c.status = CredentialStatus.ISSUED;
      await this.credRepo.save(c);
      await this.skillRepo.update(
        { sourceCredentialId: c.id },
        { isVerified: true },
      );

      await this.notifications.create({
        userId: candidate.id,
        type: NotificationType.CREDENTIAL_ISSUED,
        title: 'Văn bằng mới',
        message: `${institution.name} đã cấp văn bằng "${c.title}" cho bạn.`,
        referenceType: 'credential',
        referenceId: c.id,
      });
      anchored++;
    }
    return { anchored };
  }

  /**
   * Bulk anchor: the issuer signed the Merkle ROOT once (one signature for the
   * whole batch) and broadcast issueBatch(root). Verify that single signature +
   * the on-chain anchor, then store each credential's VC (sharing the batch
   * signature + its own Merkle proof) and mark them issued.
   */
  async anchorBatchBulk(
    issuerUserId: string,
    dto: AnchorBulkDto,
  ): Promise<{ anchored: number }> {
    const institution = await this.institutionRepo.findOne({
      where: { userId: issuerUserId },
    });
    if (!institution) {
      throw new ForbiddenException('Issuer has no registered institution');
    }
    if (!institution.signingAddress) {
      throw new BadRequestException('Register the issuer signing wallet first');
    }

    const creds = await this.credRepo.find({
      where: { merkleRoot: dto.merkleRoot, institutionId: institution.id },
    });
    if (creds.length === 0) {
      throw new NotFoundException(
        'No prepared credentials for this Merkle root',
      );
    }
    const ordered = creds
      .slice()
      .sort((a, b) => (a.leafIndex ?? 0) - (b.leafIndex ?? 0));
    const tree = buildMerkleTree(ordered.map((c) => c.credentialHash!));
    if (tree.root.toLowerCase() !== dto.merkleRoot.toLowerCase()) {
      throw new BadRequestException(
        'Merkle root does not match the prepared credentials',
      );
    }

    const onChain = await this.blockchain.verifyBatchOnChain(dto.merkleRoot);
    if (!onChain.exists) {
      throw new BadRequestException('Merkle root is not anchored on-chain yet');
    }
    if (
      onChain.issuer.toLowerCase() !== institution.signingAddress.toLowerCase()
    ) {
      throw new ForbiddenException('Batch was anchored by a different address');
    }

    // Rebuild the exact typed data the issuer signed and verify the single
    // batch signature recovers to the institution's wallet.
    const batchTypedData = this.vcService.buildBatchTypedData({
      merkleRoot: dto.merkleRoot,
      institution,
      count: ordered.length,
      issuedAt: dto.issuedAt,
    });
    const recovered = ethers.verifyTypedData(
      batchTypedData.domain,
      {
        Batch: batchTypedData.types.Batch as unknown as ethers.TypedDataField[],
      },
      batchTypedData.message,
      dto.batchSignature,
    );
    if (recovered.toLowerCase() !== institution.signingAddress.toLowerCase()) {
      throw new BadRequestException('Invalid batch signature');
    }

    const createdAt = new Date().toISOString();
    let anchored = 0;
    for (const c of ordered) {
      const candidate = await this.userRepo.findOne({
        where: { id: c.candidateId! },
      });
      if (!candidate) continue;
      const entry = await this.statusList.assignEntry(c.id);
      const vcJson = this.vcService.assembleBatchVc({
        credential: c,
        candidate,
        institutionName: institution.name,
        batchTypedData,
        batchSignature: dto.batchSignature,
        createdAt,
      });
      (vcJson as Record<string, unknown>).credentialStatus =
        this.statusList.buildCredentialStatus(entry);

      c.vcJson = vcJson;
      c.digitalSignature = dto.batchSignature;
      c.issuerDid = batchTypedData.message.issuerDid;
      c.blockchainTxHash = dto.txHash;
      c.blockchainTimestamp = new Date(onChain.timestamp * 1000);
      c.status = CredentialStatus.ISSUED;
      await this.credRepo.save(c);
      await this.skillRepo.update(
        { sourceCredentialId: c.id },
        { isVerified: true },
      );

      await this.notifications.create({
        userId: candidate.id,
        type: NotificationType.CREDENTIAL_ISSUED,
        title: 'Văn bằng mới',
        message: `${institution.name} đã cấp văn bằng "${c.title}" cho bạn.`,
        referenceType: 'credential',
        referenceId: c.id,
      });
      anchored++;
    }
    return { anchored };
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
    const proof = (
      credential.vcJson as {
        proof?: { type?: string; eip712?: { primaryType?: string } };
      } | null
    )?.proof;
    if (proof?.type === EIP712_PROOF_TYPE) {
      // Batch-signed (1 signature over the Merkle root) vs per-credential.
      const isBatch = proof.eip712?.primaryType === BATCH_EIP712_PRIMARY_TYPE;
      const v = isBatch
        ? this.vcService.verifyBatchEip712(credential.vcJson)
        : this.vcService.verifyEip712(credential.vcJson);
      vcSignatureValid = v.valid;
      details.vc = {
        type: isBatch ? 'eip712-batch' : 'eip712',
        valid: v.valid,
        signerAddress: v.signerAddress,
        issuerDid: v.issuerDid,
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
