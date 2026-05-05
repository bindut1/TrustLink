import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { BlockchainTransaction } from '../../database/entities/blockchain-transaction.entity';
import { CandidateSkill } from '../../database/entities/candidate-skill.entity';
import { Credential } from '../../database/entities/credential.entity';
import { CredentialStatus, TxStatus, TxType } from '../../database/enums';
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
    @InjectRepository(BlockchainTransaction)
    private readonly txRepo: Repository<BlockchainTransaction>,
    @InjectRepository(CandidateSkill)
    private readonly skillRepo: Repository<CandidateSkill>,
    private readonly embeddings: EmbeddingService,
  ) {}

  /**
   * Every minute, look for credentials stuck in `pending` for more than 10
   * minutes and check whether their tx actually landed on-chain. Covers cases
   * where the worker crashed between submission and confirmation, or where the
   * receipt arrived after our wait timed out.
   */
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
    if (!credential.credentialHash) return;

    const onChain = await this.blockchain.verifyCredentialOnChain(
      credential.credentialHash,
    );
    if (!onChain.exists) return;

    const provider = this.blockchain.getProvider();

    const issueTx = await this.txRepo.findOne({
      where: {
        credentialId: credential.id,
        transactionType: TxType.ISSUE_CREDENTIAL,
      },
      order: { createdAt: 'DESC' },
    });

    if (issueTx && issueTx.txHash && issueTx.status !== TxStatus.CONFIRMED) {
      const receipt = await provider.getTransactionReceipt(issueTx.txHash);
      if (receipt && receipt.status === 1) {
        issueTx.status = TxStatus.CONFIRMED;
        issueTx.blockNumber = receipt.blockNumber.toString();
        issueTx.confirmedAt = new Date();
        await this.txRepo.save(issueTx);
      }
    }

    credential.status = onChain.isRevoked
      ? CredentialStatus.REVOKED
      : CredentialStatus.ISSUED;
    credential.blockchainTimestamp = new Date(onChain.timestamp * 1000);
    if (issueTx?.txHash && !credential.blockchainTxHash) {
      credential.blockchainTxHash = issueTx.txHash;
    }
    if (issueTx?.blockNumber && !credential.blockchainBlockNumber) {
      credential.blockchainBlockNumber = issueTx.blockNumber;
    }
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
