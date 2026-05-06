import { InjectQueue } from '@nestjs/bull';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { Queue } from 'bull';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Repository } from 'typeorm';
import { BatchImport } from '../../database/entities/batch-import.entity';
import { CredentialType } from '../../database/entities/credential-type.entity';
import { Institution } from '../../database/entities/institution.entity';
import { ApprovalStatus, BatchStatus } from '../../database/enums';
import {
  BATCH_IMPORT_JOB_PROCESS,
  BATCH_IMPORT_QUEUE,
  BatchImportJobData,
} from './batch-imports.constants';
import { CreateBatchImportDto } from './dto/create-batch-import.dto';

@Injectable()
export class BatchImportsService {
  constructor(
    @InjectRepository(BatchImport)
    private readonly batchRepo: Repository<BatchImport>,
    @InjectRepository(Institution)
    private readonly institutionRepo: Repository<Institution>,
    @InjectRepository(CredentialType)
    private readonly typeRepo: Repository<CredentialType>,
    @InjectQueue(BATCH_IMPORT_QUEUE)
    private readonly queue: Queue<BatchImportJobData>,
    private readonly config: ConfigService,
  ) {}

  async createFromUpload(
    issuerUserId: string,
    dto: CreateBatchImportDto,
    file: Express.Multer.File | undefined,
  ): Promise<BatchImport> {
    if (!file) {
      throw new BadRequestException('Excel file is required (field: file)');
    }

    const institution = await this.institutionRepo.findOne({
      where: { userId: issuerUserId },
    });
    if (!institution) {
      throw new ForbiddenException('Issuer has no registered institution');
    }
    if (institution.approvalStatus !== ApprovalStatus.APPROVED) {
      throw new ForbiddenException('Institution is not approved');
    }

    const credentialType = await this.typeRepo.findOne({
      where: { id: dto.credentialTypeId },
    });
    if (!credentialType) {
      throw new NotFoundException('Credential type not found');
    }
    if (!credentialType.isActive) {
      throw new BadRequestException('Credential type is inactive');
    }

    const filePath = await this.persistUpload(file);

    const batch = await this.batchRepo.save(
      this.batchRepo.create({
        institutionId: institution.id,
        initiatedBy: issuerUserId,
        credentialTypeId: credentialType.id,
        originalFilename: file.originalname,
        fileUrl: filePath,
        status: BatchStatus.UPLOADING,
        errorReport: [],
      }),
    );

    await this.queue.add(
      BATCH_IMPORT_JOB_PROCESS,
      { batchImportId: batch.id },
      { attempts: 1, removeOnComplete: true, removeOnFail: false },
    );

    return batch;
  }

  async findById(id: string): Promise<BatchImport> {
    const batch = await this.batchRepo.findOne({
      where: { id },
      relations: ['credentialType', 'institution'],
    });
    if (!batch) throw new NotFoundException('Batch import not found');
    return batch;
  }

  async findMine(issuerUserId: string): Promise<BatchImport[]> {
    const institution = await this.institutionRepo.findOne({
      where: { userId: issuerUserId },
    });
    if (!institution) {
      throw new ForbiddenException('Issuer has no registered institution');
    }
    return this.batchRepo.find({
      where: { institutionId: institution.id },
      relations: ['credentialType'],
      order: { createdAt: 'DESC' },
    });
  }

  private async persistUpload(file: Express.Multer.File): Promise<string> {
    const uploadDir =
      this.config.get<string>('BATCH_UPLOAD_DIR') ||
      path.join(process.cwd(), 'uploads', 'batch-imports');
    await fs.mkdir(uploadDir, { recursive: true });
    const safeName = path.basename(file.originalname).replace(/[^\w.\-]/g, '_');
    const filePath = path.join(uploadDir, `${randomUUID()}-${safeName}`);
    await fs.writeFile(filePath, file.buffer);
    return filePath;
  }
}
