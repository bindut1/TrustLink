import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';

export interface AuditLogInput {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuditLogQuery {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
}

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async record(input: AuditLogInput): Promise<void> {
    try {
      await this.repo.save(
        this.repo.create({
          userId: input.userId ?? null,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId ?? null,
          oldValues: input.oldValues ?? null,
          newValues: input.newValues ?? null,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
        }),
      );
    } catch (err) {
      this.logger.error(
        `Failed to write audit log [${input.action}]: ${(err as Error).message}`,
      );
    }
  }

  async query(filter: AuditLogQuery): Promise<AuditLog[]> {
    const where: FindOptionsWhere<AuditLog> = {};
    if (filter.userId) where.userId = filter.userId;
    if (filter.action) where.action = filter.action;
    if (filter.entityType) where.entityType = filter.entityType;
    if (filter.entityId) where.entityId = filter.entityId;
    return this.repo.find({
      where,
      order: { createdAt: 'DESC' },
      take: Math.min(filter.limit ?? 100, 500),
      relations: ['user'],
    });
  }
}
