import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BatchImport } from '../../database/entities/batch-import.entity';
import { CredentialType } from '../../database/entities/credential-type.entity';
import { Credential } from '../../database/entities/credential.entity';
import { User } from '../../database/entities/user.entity';
import { BatchStatus, UserRole } from '../../database/enums';
import { CredentialsService } from '../credentials/credentials.service';
import { CreateCredentialDto } from '../credentials/dto/create-credential.dto';
import { BatchRowError } from './batch-imports.constants';
import { ParsedRow, parseExcelFile } from './helpers/excel-parser';

const STANDARD_COLUMNS = new Set([
  'email',
  'credential_number',
  'title',
  'issued_date',
  'expiry_date',
]);

interface SchemaField {
  key: string;
  label?: string;
  type?: string;
  required?: boolean;
}

interface NormalizedRow {
  email: string;
  credentialNumber: string;
  title: string;
  issuedDate: string;
  expiryDate: string | null;
  metadata: Record<string, unknown>;
}

@Injectable()
export class BatchImportRunner {
  private readonly logger = new Logger(BatchImportRunner.name);

  // Persist progress every N rows so the frontend poller sees movement without
  // hammering the DB on huge files.
  private static readonly PROGRESS_INTERVAL = 5;

  constructor(
    @InjectRepository(BatchImport)
    private readonly batchRepo: Repository<BatchImport>,
    @InjectRepository(CredentialType)
    private readonly typeRepo: Repository<CredentialType>,
    @InjectRepository(Credential)
    private readonly credRepo: Repository<Credential>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly credentialsService: CredentialsService,
  ) {}

  async processBatch(batchImportId: string): Promise<void> {
    const batch = await this.batchRepo.findOne({
      where: { id: batchImportId },
    });
    if (!batch) {
      this.logger.warn(`Batch ${batchImportId} not found`);
      return;
    }
    if (
      batch.status === BatchStatus.COMPLETED ||
      batch.status === BatchStatus.PARTIALLY_COMPLETED ||
      batch.status === BatchStatus.FAILED
    ) {
      return;
    }
    if (!batch.fileUrl || !batch.credentialTypeId || !batch.initiatedBy) {
      await this.markFailed(batch, 'Batch is missing file or credential type');
      return;
    }

    const credentialType = await this.typeRepo.findOne({
      where: { id: batch.credentialTypeId },
    });
    if (!credentialType) {
      await this.markFailed(batch, 'Credential type not found');
      return;
    }

    try {
      batch.status = BatchStatus.VALIDATING;
      batch.startedAt = new Date();
      await this.batchRepo.save(batch);

      const parsed = parseExcelFile(batch.fileUrl);
      batch.totalRows = parsed.length;
      await this.batchRepo.save(batch);

      const errors: BatchRowError[] = [];
      const validRows: Array<{ rowNumber: number; data: NormalizedRow }> = [];
      const schemaFields = this.readSchemaFields(credentialType);

      for (const row of parsed) {
        const rowErrors = this.validateRow(row, schemaFields);
        if (rowErrors.length > 0) {
          errors.push(...rowErrors);
          continue;
        }
        validRows.push({
          rowNumber: row.rowNumber,
          data: this.normalizeRow(row, schemaFields),
        });
      }

      batch.status = BatchStatus.PROCESSING;
      batch.errorCount = errors.length;
      batch.errorReport = errors;
      await this.batchRepo.save(batch);

      // Track invalid rows as already-processed since we won't touch them again.
      let processed = parsed.length - validRows.length;
      let success = 0;

      for (const { rowNumber, data } of validRows) {
        try {
          await this.issueRow(batch, data);
          success += 1;
        } catch (err) {
          errors.push({
            row: rowNumber,
            field: null,
            error: (err as Error).message,
          });
        }
        processed += 1;

        if (
          processed % BatchImportRunner.PROGRESS_INTERVAL === 0 ||
          processed === parsed.length
        ) {
          batch.processedRows = processed;
          batch.successCount = success;
          batch.errorCount = errors.length;
          batch.errorReport = errors;
          await this.batchRepo.save(batch);
        }
      }

      batch.processedRows = parsed.length;
      batch.successCount = success;
      batch.errorCount = errors.length;
      batch.errorReport = errors;
      batch.completedAt = new Date();
      batch.status = this.terminalStatus(parsed.length, success, errors.length);
      await this.batchRepo.save(batch);
    } catch (err) {
      this.logger.error(
        `Batch ${batch.id} failed: ${(err as Error).message}`,
      );
      await this.markFailed(batch, (err as Error).message);
    }
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  private readSchemaFields(credentialType: CredentialType): SchemaField[] {
    const schema = (credentialType.fieldSchema ?? {}) as {
      fields?: SchemaField[];
    };
    return Array.isArray(schema.fields) ? schema.fields : [];
  }

  private validateRow(
    row: ParsedRow,
    schemaFields: SchemaField[],
  ): BatchRowError[] {
    const errors: BatchRowError[] = [];
    const v = row.values;

    if (!this.isNonEmpty(v.email)) {
      errors.push({ row: row.rowNumber, field: 'email', error: 'email is required' });
    }
    if (!this.isNonEmpty(v.credential_number)) {
      errors.push({
        row: row.rowNumber,
        field: 'credential_number',
        error: 'credential_number is required',
      });
    }
    if (!this.isNonEmpty(v.title)) {
      errors.push({ row: row.rowNumber, field: 'title', error: 'title is required' });
    }
    if (!this.isNonEmpty(v.issued_date)) {
      errors.push({
        row: row.rowNumber,
        field: 'issued_date',
        error: 'issued_date is required',
      });
    } else if (!this.toIsoDate(v.issued_date)) {
      errors.push({
        row: row.rowNumber,
        field: 'issued_date',
        error: 'issued_date is not a valid date',
      });
    }
    if (this.isNonEmpty(v.expiry_date) && !this.toIsoDate(v.expiry_date)) {
      errors.push({
        row: row.rowNumber,
        field: 'expiry_date',
        error: 'expiry_date is not a valid date',
      });
    }

    for (const field of schemaFields) {
      if (!field?.key) continue;
      if (!field.required) continue;
      if (STANDARD_COLUMNS.has(field.key)) continue;
      if (!this.isNonEmpty(v[field.key])) {
        errors.push({
          row: row.rowNumber,
          field: field.key,
          error: `${field.key} is required`,
        });
      }
    }

    return errors;
  }

  private normalizeRow(
    row: ParsedRow,
    schemaFields: SchemaField[],
  ): NormalizedRow {
    const v = row.values;
    const metadata: Record<string, unknown> = {};

    // Take metadata from any column that's not a standard one. Schema-declared
    // fields take priority for ordering and naming consistency.
    const declaredKeys = new Set(
      schemaFields.map((f) => f?.key).filter((k): k is string => Boolean(k)),
    );
    for (const [key, value] of Object.entries(v)) {
      if (STANDARD_COLUMNS.has(key)) continue;
      if (value === null || value === undefined || value === '') continue;
      if (declaredKeys.size > 0 && !declaredKeys.has(key)) {
        // Unknown column — still pass through, may be useful metadata.
      }
      metadata[key] = value instanceof Date ? this.toIsoDate(value) : value;
    }

    return {
      email: String(v.email).trim().toLowerCase(),
      credentialNumber: String(v.credential_number).trim(),
      title: String(v.title).trim(),
      issuedDate: this.toIsoDate(v.issued_date)!,
      expiryDate: this.isNonEmpty(v.expiry_date)
        ? this.toIsoDate(v.expiry_date)
        : null,
      metadata,
    };
  }

  // ---------------------------------------------------------------------------
  // Per-row issuance
  // ---------------------------------------------------------------------------

  private async issueRow(
    batch: BatchImport,
    data: NormalizedRow,
  ): Promise<void> {
    const candidate = await this.userRepo.findOne({
      where: { email: data.email },
    });
    if (!candidate) {
      throw new Error(`candidate not found for email ${data.email}`);
    }
    if (candidate.role !== UserRole.CANDIDATE) {
      throw new Error(`user ${data.email} is not a candidate`);
    }

    const dto: CreateCredentialDto = {
      credentialNumber: data.credentialNumber,
      credentialTypeId: batch.credentialTypeId!,
      candidateId: candidate.id,
      title: data.title,
      issuedDate: data.issuedDate,
      expiryDate: data.expiryDate ?? undefined,
      metadata: data.metadata,
    };

    const created = await this.credentialsService.create(
      batch.initiatedBy!,
      dto,
    );

    await this.credRepo.update(created.id, { batchImportId: batch.id });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private isNonEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  }

  private toIsoDate(value: unknown): string | null {
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10);
    }
    if (typeof value === 'number') {
      // Excel serial dates fall outside this branch when cellDates:true is set,
      // but defend against numeric date columns just in case.
      const ms = Math.round((value - 25569) * 86400 * 1000);
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const d = new Date(trimmed);
      return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
    }
    return null;
  }

  private terminalStatus(
    total: number,
    success: number,
    errors: number,
  ): BatchStatus {
    if (errors === 0 && success === total) return BatchStatus.COMPLETED;
    if (success === 0) return BatchStatus.FAILED;
    return BatchStatus.PARTIALLY_COMPLETED;
  }

  private async markFailed(batch: BatchImport, message: string): Promise<void> {
    const existing = Array.isArray(batch.errorReport)
      ? (batch.errorReport as BatchRowError[])
      : [];
    batch.status = BatchStatus.FAILED;
    batch.completedAt = new Date();
    batch.errorReport = [
      ...existing,
      { row: null, field: null, error: message },
    ];
    batch.errorCount = (batch.errorReport as BatchRowError[]).length;
    await this.batchRepo.save(batch);
  }
}
