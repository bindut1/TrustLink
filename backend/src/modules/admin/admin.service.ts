import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Action } from '../../database/entities/action.entity';
import { RoleAction } from '../../database/entities/role-action.entity';
import { BlockchainTransaction } from '../../database/entities/blockchain-transaction.entity';
import { Credential } from '../../database/entities/credential.entity';
import { Institution } from '../../database/entities/institution.entity';
import { RefreshToken } from '../../database/entities/refresh-token.entity';
import { UserActionOverride } from '../../database/entities/user-action-override.entity';
import { User } from '../../database/entities/user.entity';
import {
  AccountStatus,
  ApprovalStatus,
  CredentialStatus,
  NotificationType,
  TxStatus,
  UserRole,
} from '../../database/enums';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { ListTxQuery } from './dto/list-tx.query';
import { ListUsersQuery } from './dto/list-users.query';
import { SetOverrideDto } from './dto/set-override.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Institution)
    private readonly institutionRepo: Repository<Institution>,
    @InjectRepository(Credential)
    private readonly credentialRepo: Repository<Credential>,
    @InjectRepository(BlockchainTransaction)
    private readonly txRepo: Repository<BlockchainTransaction>,
    @InjectRepository(Action) private readonly actionRepo: Repository<Action>,
    @InjectRepository(RoleAction)
    private readonly roleActionRepo: Repository<RoleAction>,
    @InjectRepository(UserActionOverride)
    private readonly overrideRepo: Repository<UserActionOverride>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly auditLogs: AuditLogsService,
    private readonly notifications: NotificationsService,
  ) {}

  // ───────────── Dashboard ─────────────

  async getDashboardStats() {
    const [
      totalUsers,
      adminCount,
      issuerCount,
      candidateCount,
      recruiterCount,
      totalCredentials,
      issuedCredentials,
      revokedCredentials,
      totalInstitutions,
      pendingInstitutions,
      approvedInstitutions,
      queuedTx,
      failedTx,
      confirmedTx,
    ] = await Promise.all([
      this.userRepo.count(),
      this.userRepo.count({ where: { role: UserRole.ADMIN } }),
      this.userRepo.count({ where: { role: UserRole.ISSUER } }),
      this.userRepo.count({ where: { role: UserRole.CANDIDATE } }),
      this.userRepo.count({ where: { role: UserRole.RECRUITER } }),
      this.credentialRepo.count(),
      this.credentialRepo.count({ where: { status: CredentialStatus.ISSUED } }),
      this.credentialRepo.count({ where: { status: CredentialStatus.REVOKED } }),
      this.institutionRepo.count(),
      this.institutionRepo.count({
        where: { approvalStatus: ApprovalStatus.PENDING },
      }),
      this.institutionRepo.count({
        where: { approvalStatus: ApprovalStatus.APPROVED },
      }),
      this.txRepo.count({ where: { status: TxStatus.QUEUED } }),
      this.txRepo.count({ where: { status: TxStatus.FAILED } }),
      this.txRepo.count({ where: { status: TxStatus.CONFIRMED } }),
    ]);

    return {
      users: {
        total: totalUsers,
        byRole: {
          admin: adminCount,
          issuer: issuerCount,
          candidate: candidateCount,
          recruiter: recruiterCount,
        },
      },
      credentials: {
        total: totalCredentials,
        issued: issuedCredentials,
        revoked: revokedCredentials,
      },
      institutions: {
        total: totalInstitutions,
        pending: pendingInstitutions,
        approved: approvedInstitutions,
      },
      transactions: {
        queued: queuedTx,
        failed: failedTx,
        confirmed: confirmedTx,
      },
    };
  }

  // ───────────── Users ─────────────

  async listUsers(query: ListUsersQuery): Promise<Omit<User, 'passwordHash'>[]> {
    const where: Record<string, unknown>[] = [];
    const baseFilter: Record<string, unknown> = {};
    if (query.role) baseFilter.role = query.role;
    if (query.status) baseFilter.status = query.status;

    if (query.search) {
      const term = `%${query.search}%`;
      where.push({ ...baseFilter, email: ILike(term) });
      where.push({ ...baseFilter, fullName: ILike(term) });
    }

    const users = await this.userRepo.find({
      where: where.length > 0 ? where : baseFilter,
      order: { createdAt: 'DESC' },
      take: 200,
    });
    return users.map(stripPassword);
  }

  async updateUserStatus(
    id: string,
    status: AccountStatus,
    adminId?: string,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const previousStatus = user.status;
    user.status = status;
    await this.userRepo.save(user);

    await this.auditLogs.record({
      userId: adminId ?? null,
      action: 'user.status_change',
      entityType: 'user',
      entityId: user.id,
      oldValues: { status: previousStatus },
      newValues: { status },
    });

    // On suspension, revoke all active refresh tokens so the user is forced
    // out of every session.
    if (status === AccountStatus.SUSPENDED) {
      await this.refreshTokenRepo
        .createQueryBuilder()
        .update(RefreshToken)
        .set({ revokedAt: new Date() })
        .where('user_id = :id', { id })
        .andWhere('revoked_at IS NULL')
        .execute();
    }

    return stripPassword(user);
  }

  // ───────────── Action overrides ─────────────

  async listActions(role?: UserRole): Promise<Action[]> {
    if (!role) {
      return this.actionRepo.find({ order: { module: 'ASC', code: 'ASC' } });
    }
    // Return only actions that belong to the given role so admin sees only
    // the actions that are actually relevant to that user.
    const roleActions = await this.roleActionRepo.find({
      where: { role },
      relations: ['action'],
    });
    return roleActions
      .map((ra) => ra.action)
      .sort((a, b) =>
        a.module !== b.module
          ? a.module.localeCompare(b.module)
          : a.code.localeCompare(b.code),
      );
  }

  async listOverrides(userId: string): Promise<UserActionOverride[]> {
    await this.assertUserExists(userId);
    return this.overrideRepo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
  }

  async upsertOverride(
    userId: string,
    adminId: string,
    dto: SetOverrideDto,
  ): Promise<UserActionOverride> {
    await this.assertUserExists(userId);

    const action = await this.actionRepo.findOne({
      where: { id: dto.actionId },
    });
    if (!action) throw new NotFoundException('Action not found');

    const existing = await this.overrideRepo.findOne({
      where: { userId, actionId: dto.actionId },
    });

    if (existing) {
      existing.isEnabled = dto.isEnabled;
      existing.reason = dto.reason ?? null;
      existing.overriddenBy = adminId;
      existing.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
      return this.overrideRepo.save(existing);
    }

    const override = this.overrideRepo.create({
      userId,
      actionId: dto.actionId,
      isEnabled: dto.isEnabled,
      reason: dto.reason ?? null,
      overriddenBy: adminId,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });
    const saved = await this.overrideRepo.save(override);
    await this.auditLogs.record({
      userId: adminId,
      action: 'user.override_set',
      entityType: 'user_action_override',
      entityId: saved.id,
      newValues: {
        targetUserId: userId,
        actionId: dto.actionId,
        isEnabled: dto.isEnabled,
        reason: dto.reason,
      },
    });
    return saved;
  }

  async removeOverride(
    userId: string,
    actionId: string,
    adminId?: string,
  ): Promise<void> {
    await this.assertUserExists(userId);
    const result = await this.overrideRepo.delete({ userId, actionId });
    if (!result.affected) {
      throw new NotFoundException('Override not found');
    }
    await this.auditLogs.record({
      userId: adminId ?? null,
      action: 'user.override_removed',
      entityType: 'user_action_override',
      oldValues: { targetUserId: userId, actionId },
    });
  }

  // ───────────── Blockchain ─────────────

  async listTransactions(query: ListTxQuery) {
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;

    const txs = await this.txRepo.find({
      where,
      relations: ['initiator', 'institution'],
      order: { queuedAt: 'DESC' },
      take: query.limit ?? 100,
    });

    return txs.map((t) => ({
      id: t.id,
      transactionType: t.transactionType,
      status: t.status,
      txHash: t.txHash,
      blockNumber: t.blockNumber !== null ? Number(t.blockNumber) : null,
      contractMethod: t.contractMethod,
      initiatedByName:
        t.institution?.name ?? t.initiator?.fullName ?? 'Unknown',
      retryCount: t.retryCount,
      errorMessage: t.errorMessage,
      queuedAt: t.queuedAt,
      submittedAt: t.submittedAt,
      confirmedAt: t.confirmedAt,
      failedAt: t.failedAt,
    }));
  }

  // ───────────── Audit logs ─────────────

  async listAuditLogs(filter: {
    userId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    limit?: number;
  }) {
    return this.auditLogs.query(filter);
  }

  // ───────────── Announcements ─────────────

  async broadcastAnnouncement(
    dto: CreateAnnouncementDto,
  ): Promise<{ sent: number }> {
    const where = dto.targetRole ? { role: dto.targetRole } : {};
    const users = await this.userRepo.find({ where, select: ['id'] });
    const userIds = users.map((u) => u.id);
    await this.notifications.broadcast(
      {
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: dto.title,
        message: dto.message,
      },
      userIds,
    );
    return { sent: userIds.length };
  }

  // ───────────── helpers ─────────────

  private async assertUserExists(id: string): Promise<void> {
    const exists = await this.userRepo.exist({ where: { id } });
    if (!exists) {
      throw new NotFoundException('User not found');
    }
  }
}

function stripPassword(user: User): Omit<User, 'passwordHash'> {
  const { passwordHash: _ph, ...rest } = user;
  return rest;
}
