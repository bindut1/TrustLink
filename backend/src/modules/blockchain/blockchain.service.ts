import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ethers } from 'ethers';
import { In, Repository } from 'typeorm';
import { BlockchainTransaction } from '../../database/entities/blockchain-transaction.entity';
import { CandidateSkill } from '../../database/entities/candidate-skill.entity';
import { Credential } from '../../database/entities/credential.entity';
import { Institution } from '../../database/entities/institution.entity';
import { User } from '../../database/entities/user.entity';
import { TxStatus, TxType } from '../../database/enums';
import { CREDENTIAL_REGISTRY_ABI } from './contract/credential-registry.abi';
import { EmbeddingService } from '../matching/embedding.service';
import { VcService } from './vc.service';

export interface OnChainVerification {
  exists: boolean;
  issuer: string;
  timestamp: number;
  isRevoked: boolean;
}

/** Current canonical hashing scheme. Stored on `credential.hash_version`. */
export const HASH_VERSION_CANONICAL = 'v2-jcs';

/**
 * Deterministic, key-sorted JSON serialization (JCS / RFC 8785 style). Unlike
 * JSON.stringify, object key order is normalized recursively so the same
 * logical content always produces the same string — and therefore the same
 * keccak256 hash — regardless of how Postgres returns jsonb keys.
 */
export function canonicalJsonStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalJsonStringify).join(',') + ']';
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return (
    '{' +
    keys
      .map((k) => JSON.stringify(k) + ':' + canonicalJsonStringify(obj[k]))
      .join(',') +
    '}'
  );
}

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);

  private provider!: ethers.JsonRpcProvider;
  private wallet!: ethers.Wallet;
  private contract!: ethers.Contract;

  // Serialize signed tx submissions so nonce stays consistent across queue
  // workers and inline admin calls inside this process.
  private submitChain: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(BlockchainTransaction)
    private readonly txRepo: Repository<BlockchainTransaction>,
    @InjectRepository(Credential)
    private readonly credRepo: Repository<Credential>,
    @InjectRepository(Institution)
    private readonly institutionRepo: Repository<Institution>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(CandidateSkill)
    private readonly skillRepo: Repository<CandidateSkill>,
    private readonly vcService: VcService,
    private readonly embeddings: EmbeddingService,
  ) {}

  onModuleInit(): void {
    const rpcUrl = this.buildRpcUrl();
    const privateKey = this.config.get<string>('DEPLOYER_PRIVATE_KEY');
    const contractAddress = this.config.get<string>('CONTRACT_ADDRESS');

    const addressValid = contractAddress && ethers.isAddress(contractAddress);

    if (!privateKey || !addressValid) {
      this.logger.warn(
        'Blockchain not fully configured (missing or invalid DEPLOYER_PRIVATE_KEY / CONTRACT_ADDRESS). On-chain calls will be skipped.',
      );
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    if (privateKey) {
      this.wallet = new ethers.Wallet(privateKey, this.provider);
    }
    if (addressValid) {
      this.contract = new ethers.Contract(
        contractAddress!,
        CREDENTIAL_REGISTRY_ABI as unknown as ethers.InterfaceAbi,
        this.wallet ?? this.provider,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Public API consumed by other modules
  // ---------------------------------------------------------------------------

  /**
   * Compute deterministic bytes32 hash for a credential. The same fields must
   * produce the same hash on issuance and verification.
   */
  computeCredentialHash(credential: Credential): string {
    const payload = {
      credentialNumber: credential.credentialNumber,
      institutionId: credential.institutionId,
      candidateId: credential.candidateId,
      title: credential.title,
      issuedDate: this.normalizeDate(credential.issuedDate),
      expiryDate: credential.expiryDate
        ? this.normalizeDate(credential.expiryDate)
        : null,
      metadata: credential.metadata ?? {},
    };
    // Version-aware so legacy credentials (hashVersion null) keep verifying with
    // the original non-canonical serialization, while new credentials use the
    // canonical scheme that is stable against jsonb key reordering.
    const serialized =
      credential.hashVersion === HASH_VERSION_CANONICAL
        ? canonicalJsonStringify(payload)
        : JSON.stringify(payload);
    return ethers.keccak256(ethers.toUtf8Bytes(serialized));
  }

  /**
   * Record an issuer-signed per-leaf revocation (Option B). The issuer broadcast
   * `revokeLeaf(leafHash)` from their OWN wallet (non-custodial, like issueBatch),
   * so this never signs anything — it confirms the revocation actually landed
   * on-chain, persists an audit row, and flips the dependent skill flags. Throws
   * if the leaf is not revoked on-chain so the caller never marks a credential
   * revoked in the DB before the chain agrees.
   */
  async recordLeafRevocation(args: {
    credentialId: string;
    institutionId: string | null;
    initiatedBy: string;
    leafHash: string;
    txHash: string;
  }): Promise<BlockchainTransaction> {
    if (!this.contract) {
      throw new InternalServerErrorException('Blockchain not configured');
    }

    const revoked = await this.isLeafRevokedOnChain(args.leafHash);
    if (!revoked) {
      throw new BadRequestException(
        'Leaf is not revoked on-chain — the revoke transaction may not be confirmed yet',
      );
    }

    const meta = await this.fetchTxMeta(args.txHash);
    const tx = await this.txRepo.save(
      this.txRepo.create({
        transactionType: TxType.REVOKE_CREDENTIAL,
        status: TxStatus.CONFIRMED,
        credentialId: args.credentialId,
        institutionId: args.institutionId,
        initiatedBy: args.initiatedBy,
        contractMethod: 'revokeLeaf',
        contractParams: { leafHash: args.leafHash },
        txHash: args.txHash,
        ...meta,
      }),
    );

    // On-chain revoke landed → the skills this credential backed are no longer
    // verified, and the candidate's embedding must be refreshed for matching.
    const credential = await this.credRepo.findOne({
      where: { id: args.credentialId },
    });
    await this.setSkillsVerified(args.credentialId, false);
    await this.refreshCandidateEmbedding(credential?.candidateId);

    return tx;
  }

  /**
   * Read-only check: has this whole Merkle batch been revoked on-chain
   * (`revokeBatch`)? No gas, no signing.
   */
  async isBatchRevokedOnChain(merkleRoot: string): Promise<boolean> {
    const onChain = await this.verifyBatchOnChain(merkleRoot);
    return onChain.exists && onChain.isRevoked;
  }

  /**
   * Record an issuer-signed WHOLE-BATCH revocation (`revokeBatch`, Option B's
   * coarse counterpart). The issuer broadcast it from their own wallet; here we
   * confirm the batch is revoked on-chain, persist one audit row, and unverify
   * the skills of every credential in the batch. The per-credential DB status +
   * StatusList bits are flipped by the caller.
   */
  async recordBatchRevocation(args: {
    institutionId: string | null;
    initiatedBy: string;
    merkleRoot: string;
    txHash: string;
    credentialIds: string[];
  }): Promise<BlockchainTransaction> {
    if (!this.contract) {
      throw new InternalServerErrorException('Blockchain not configured');
    }

    if (!(await this.isBatchRevokedOnChain(args.merkleRoot))) {
      throw new BadRequestException(
        'Batch is not revoked on-chain — the revoke transaction may not be confirmed yet',
      );
    }

    const meta = await this.fetchTxMeta(args.txHash);
    const tx = await this.txRepo.save(
      this.txRepo.create({
        transactionType: TxType.REVOKE_CREDENTIAL,
        status: TxStatus.CONFIRMED,
        credentialId: null,
        institutionId: args.institutionId,
        initiatedBy: args.initiatedBy,
        contractMethod: 'revokeBatch',
        contractParams: {
          merkleRoot: args.merkleRoot,
          count: args.credentialIds.length,
        },
        txHash: args.txHash,
        ...meta,
      }),
    );

    // Unverify every credential's skills + refresh each affected candidate once.
    for (const id of args.credentialIds) {
      await this.setSkillsVerified(id, false);
    }
    if (args.credentialIds.length > 0) {
      const creds = await this.credRepo.find({
        where: { id: In(args.credentialIds) },
      });
      const candidateIds = [
        ...new Set(creds.map((c) => c.candidateId).filter(Boolean)),
      ];
      for (const cid of candidateIds) {
        await this.refreshCandidateEmbedding(cid);
      }
    }

    return tx;
  }

  /** Best-effort receipt enrichment for an audit row / admin blockchain view. */
  private async fetchTxMeta(txHash: string): Promise<{
    blockNumber: string | null;
    gasUsed: string | null;
    gasPrice: string | null;
    submittedAt: Date;
    confirmedAt: Date;
  }> {
    let blockNumber: string | null = null;
    let gasUsed: string | null = null;
    let gasPrice: string | null = null;
    let confirmedAt = new Date();
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (receipt) {
        blockNumber = receipt.blockNumber.toString();
        gasUsed = receipt.gasUsed?.toString() ?? null;
        gasPrice = receipt.gasPrice?.toString() ?? null;
        const block = await this.provider.getBlock(receipt.blockNumber);
        if (block?.timestamp) confirmedAt = new Date(block.timestamp * 1000);
      }
    } catch (err) {
      this.logger.warn(
        `Could not fetch receipt for tx ${txHash}: ${(err as Error).message}`,
      );
    }
    return { blockNumber, gasUsed, gasPrice, submittedAt: new Date(), confirmedAt };
  }

  /**
   * Admin-only direct call: register an institution's wallet as an authorized
   * issuer on the contract. Synchronous because admin needs immediate feedback,
   * and addIssuer is a rare, owner-only operation.
   */
  async addIssuerOnChain(args: {
    institutionId: string;
    address: string;
    initiatedBy: string;
  }): Promise<BlockchainTransaction> {
    if (!this.contract || !this.wallet) {
      throw new InternalServerErrorException('Blockchain not configured');
    }
    if (!ethers.isAddress(args.address)) {
      throw new InternalServerErrorException(
        `Invalid issuer address: ${args.address}`,
      );
    }

    const txRow = await this.txRepo.save(
      this.txRepo.create({
        transactionType: TxType.ADD_ISSUER,
        status: TxStatus.QUEUED,
        institutionId: args.institutionId,
        initiatedBy: args.initiatedBy,
        contractMethod: 'addIssuer',
        contractParams: { address: args.address },
      }),
    );

    return this.runSerialized(async () => {
      try {
        const nonce = await this.provider.getTransactionCount(
          this.wallet.address,
          'pending',
        );
        const sentTx = await this.contract.addIssuer(args.address, { nonce });

        txRow.status = TxStatus.SUBMITTED;
        txRow.txHash = sentTx.hash;
        txRow.nonce = nonce;
        txRow.submittedAt = new Date();
        await this.txRepo.save(txRow);

        const receipt = await sentTx.wait();
        if (!receipt || receipt.status !== 1) {
          throw new Error('addIssuer transaction reverted');
        }

        txRow.status = TxStatus.CONFIRMED;
        txRow.blockNumber = receipt.blockNumber.toString();
        txRow.gasUsed = receipt.gasUsed?.toString() ?? null;
        txRow.gasPrice = receipt.gasPrice?.toString() ?? null;
        txRow.confirmedAt = new Date();
        return await this.txRepo.save(txRow);
      } catch (err) {
        txRow.status = TxStatus.FAILED;
        txRow.errorMessage = (err as Error).message;
        txRow.lastErrorAt = new Date();
        txRow.failedAt = new Date();
        await this.txRepo.save(txRow);
        this.logger.error(
          `addIssuerOnChain failed for institution ${args.institutionId}: ${(err as Error).message}`,
        );
        throw err;
      }
    });
  }

  /**
   * Read-only check: is this address registered as an authorized issuer on
   * the contract? Returns false on any error so callers can fold this into a
   * verification result without throwing.
   */
  async isIssuerAuthorized(address: string): Promise<boolean> {
    if (!this.contract) {
      throw new InternalServerErrorException('Blockchain not configured');
    }
    if (!ethers.isAddress(address)) return false;
    try {
      return Boolean(await this.contract.isIssuer(address));
    } catch (err) {
      this.logger.warn(
        `isIssuerAuthorized(${address}) failed: ${(err as Error).message}`,
      );
      return false;
    }
  }

  /**
   * Read-only check: has this credential's Merkle leaf been individually revoked
   * on-chain (Option B)? No gas, no signing. Returns false on any error so the
   * verifier can fold it into the result without throwing.
   */
  async isLeafRevokedOnChain(leafHash: string): Promise<boolean> {
    if (!this.contract) {
      throw new InternalServerErrorException('Blockchain not configured');
    }
    try {
      return Boolean(await this.contract.isLeafRevoked(leafHash));
    } catch (err) {
      this.logger.warn(
        `isLeafRevoked(${leafHash}) failed: ${(err as Error).message}`,
      );
      return false;
    }
  }

  /**
   * Read-only verification of a Merkle batch root (Blockcerts-style anchoring).
   * The recorded `issuer` is the institution wallet that broadcast `issueBatch`.
   */
  async verifyBatchOnChain(merkleRoot: string): Promise<OnChainVerification> {
    if (!this.contract) {
      throw new InternalServerErrorException('Blockchain not configured');
    }
    const result = await this.contract.verifyBatch(merkleRoot);
    return {
      exists: Boolean(result[0]),
      issuer: String(result[1]),
      timestamp: Number(result[2]),
      isRevoked: Boolean(result[3]),
    };
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Flip the `is_verified` flag on every candidate_skill that traces back to
   * this credential. Issue → true (skill is now backed by an on-chain proof);
   * revoke → false. Skills sourced from other still-valid credentials are
   * untouched because the WHERE filter is by `source_credential_id`.
   */
  private async setSkillsVerified(
    credentialId: string,
    verified: boolean,
  ): Promise<void> {
    await this.skillRepo.update(
      { sourceCredentialId: credentialId },
      { isVerified: verified },
    );
  }

  private async refreshCandidateEmbedding(
    candidateId: string | null | undefined,
  ): Promise<void> {
    if (!candidateId) return;
    try {
      await this.embeddings.updateCandidateEmbedding(candidateId);
    } catch (err) {
      // Embedding refresh is best-effort: a failure here must not roll back
      // the on-chain confirmation we already wrote. Log and move on; the
      // reconciliation job (or a manual reindex) can retry later.
      this.logger.warn(
        `Failed to refresh embedding for candidate ${candidateId}: ${(err as Error).message}`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private buildRpcUrl(): string {
    const explicit = this.config.get<string>('POLYGON_AMOY_RPC_URL');
    const alchemyKey = this.config.get<string>('ALCHEMY_API_KEY');
    if (alchemyKey) {
      return `https://polygon-amoy.g.alchemy.com/v2/${alchemyKey}`;
    }
    return explicit ?? 'https://rpc-amoy.polygon.technology';
  }

  /** Run an action serially with all other on-chain submissions in this process. */
  private async runSerialized<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.submitChain.then(fn, fn);
    this.submitChain = next.catch(() => undefined);
    return next;
  }

  private normalizeDate(d: Date | string): string {
    const date = d instanceof Date ? d : new Date(d);
    return date.toISOString().slice(0, 10);
  }

  isReady(): boolean {
    return Boolean(this.contract && this.wallet);
  }
}
