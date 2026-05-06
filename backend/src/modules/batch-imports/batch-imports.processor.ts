import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { BatchImportRunner } from './batch-import.runner';
import {
  BATCH_IMPORT_JOB_PROCESS,
  BATCH_IMPORT_QUEUE,
  BatchImportJobData,
} from './batch-imports.constants';

@Processor(BATCH_IMPORT_QUEUE)
export class BatchImportsProcessor {
  private readonly logger = new Logger(BatchImportsProcessor.name);

  constructor(private readonly runner: BatchImportRunner) {}

  @Process({ name: BATCH_IMPORT_JOB_PROCESS, concurrency: 1 })
  async handle(job: Job<BatchImportJobData>): Promise<void> {
    this.logger.debug(
      `Processing batch import ${job.data.batchImportId} (job=${job.id})`,
    );
    await this.runner.processBatch(job.data.batchImportId);
  }
}
