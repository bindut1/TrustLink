import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import {
  BLOCKCHAIN_JOB_ISSUE,
  BLOCKCHAIN_JOB_REVOKE,
  BLOCKCHAIN_QUEUE,
  BlockchainTxJobData,
} from './blockchain.constants';
import { BlockchainService } from './blockchain.service';

@Processor(BLOCKCHAIN_QUEUE)
export class BlockchainProcessor {
  private readonly logger = new Logger(BlockchainProcessor.name);

  constructor(private readonly service: BlockchainService) {}

  @Process({ name: BLOCKCHAIN_JOB_ISSUE, concurrency: 1 })
  async handleIssue(job: Job<BlockchainTxJobData>): Promise<void> {
    this.logger.debug(`Processing issue job ${job.id} (tx=${job.data.transactionId})`);
    await this.service.processTransaction(job.data.transactionId);
  }

  @Process({ name: BLOCKCHAIN_JOB_REVOKE, concurrency: 1 })
  async handleRevoke(job: Job<BlockchainTxJobData>): Promise<void> {
    this.logger.debug(`Processing revoke job ${job.id} (tx=${job.data.transactionId})`);
    await this.service.processTransaction(job.data.transactionId);
  }
}
