import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { CandidateSkill } from '../../database/entities/candidate-skill.entity';
import { Credential } from '../../database/entities/credential.entity';
import { CredentialStatus } from '../../database/enums';
import { EmbeddingService } from '../matching/embedding.service';
import { BlockchainService } from './blockchain.service';

const STALE_AFTER_MS = 10 * 60 * 1000;

@Injectable()
export class BlockchainReconciliationService {
  private readonly logger = new Logger(BlockchainReconciliationService.name);

  constructor(
    private readonly blockchain: BlockchainService,
    @InjectRepository(Credential)
    private readonly credRepo: Repository<Credential>,
    @InjectRepository(CandidateSkill)
    private readonly skillRepo: Repository<CandidateSkill>,
    private readonly embeddings: EmbeddingService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async reconcile(): Promise<void> {
    if (!this.blockchain.isReady()) return;

    const cutoff = new Date(Date.now() - STALE_AFTER_MS);
    const stale = await this.credRepo.find({
      where: {
        status: CredentialStatus.PENDING,
        createdAt: LessThan(cutoff),
      },
      take: 50,
    });

    if (stale.length === 0) return;
    this.logger.log(`Reconciling ${stale.length} stale pending credentials`);

    for (const credential of stale) {
      try {
        await this.reconcileOne(credential);
      } catch (err) {
        this.logger.error(
          `Reconcile failed for credential ${credential.id}: ${(err as Error).message}`,
        );
      }
    }
  }

  private async reconcileOne(credential: Credential): Promise<void> {
    if (!credential.merkleRoot || !credential.credentialHash) return;

    const onChain = await this.blockchain.verifyBatchOnChain(
      credential.merkleRoot,
    );
    if (!onChain.exists) return;

    if (!credential.vcJson) return;

    const leafRevoked = await this.blockchain.isLeafRevokedOnChain(
      credential.credentialHash,
    );

    credential.status =
      onChain.isRevoked || leafRevoked
        ? CredentialStatus.REVOKED
        : CredentialStatus.ISSUED;
    credential.blockchainTimestamp = new Date(onChain.timestamp * 1000);
    await this.credRepo.save(credential);

    await this.skillRepo.update(
      { sourceCredentialId: credential.id },
      { isVerified: credential.status === CredentialStatus.ISSUED },
    );

    if (credential.candidateId) {
      try {
        await this.embeddings.updateCandidateEmbedding(credential.candidateId);
      } catch (err) {
        this.logger.warn(
          `Failed to refresh embedding for candidate ${credential.candidateId}: ${(err as Error).message}`,
        );
      }
    }

    this.logger.log(
      `Reconciled credential ${credential.id} -> ${credential.status}`,
    );
  }
}
