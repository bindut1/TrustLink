import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institution } from '../../database/entities/institution.entity';
import { Credential } from '../../database/entities/credential.entity';
import {
  ApprovalStatus,
  CredentialStatus,
  NotificationType,
} from '../../database/enums';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ApproveInstitutionDto } from './dto/approve-institution.dto';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';

/** Aggregates powering the issuer dashboard. */
export interface IssuerDashboard {
  credentials: {
    total: number;
    onChain: number;
    revoked: number;
    byStatus: { status: string; count: number }[];
  };
  issuanceByMonth: { month: string; count: number }[];
  candidatesReached: number;
  recent: {
    id: string;
    title: string;
    candidateName: string | null;
    status: string;
    issuedDate: string | null;
  }[];
  institution: {
    name: string;
    approvalStatus: string;
    blockchainAddress: string | null;
  };
}

@Injectable()
export class InstitutionsService {
  constructor(
    @InjectRepository(Institution)
    private readonly repo: Repository<Institution>,
    @InjectRepository(Credential)
    private readonly credentialRepo: Repository<Credential>,
    private readonly notifications: NotificationsService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  /**
   * Dashboard aggregates for the current issuer's institution. All real DB
   * aggregations scoped to the institution — credentials by status, on-chain
   * count, a 6-month issuance time-series, distinct candidates reached, and the
   * latest issuances.
   */
  async getDashboard(userId: string): Promise<IssuerDashboard> {
    const institution = await this.findByUserId(userId);
    const instId = institution.id;

    const [total, onChain, revoked, byStatusRows, monthRows, reachedRow, recent] =
      await Promise.all([
        this.credentialRepo.count({ where: { institutionId: instId } }),
        this.credentialRepo
          .createQueryBuilder('c')
          .where('c.institutionId = :instId', { instId })
          .andWhere('c.blockchainTxHash IS NOT NULL')
          .andWhere('c.status != :revoked', { revoked: CredentialStatus.REVOKED })
          .getCount(),
        this.credentialRepo.count({
          where: { institutionId: instId, status: CredentialStatus.REVOKED },
        }),
        this.credentialRepo
          .createQueryBuilder('c')
          .select('c.status', 'status')
          .addSelect('COUNT(*)', 'count')
          .where('c.institutionId = :instId', { instId })
          .groupBy('c.status')
          .getRawMany<{ status: string; count: string }>(),
        this.credentialRepo
          .createQueryBuilder('c')
          .select("TO_CHAR(DATE_TRUNC('month', c.created_at), 'YYYY-MM')", 'month')
          .addSelect('COUNT(*)', 'count')
          .where('c.institutionId = :instId', { instId })
          .groupBy("DATE_TRUNC('month', c.created_at)")
          .orderBy("DATE_TRUNC('month', c.created_at)", 'ASC')
          .getRawMany<{ month: string; count: string }>(),
        this.credentialRepo
          .createQueryBuilder('c')
          .select('COUNT(DISTINCT c.candidate_id)', 'count')
          .where('c.institutionId = :instId', { instId })
          .getRawOne<{ count: string }>(),
        this.credentialRepo
          .createQueryBuilder('c')
          .leftJoin('c.candidate', 'cand')
          .addSelect(['cand.fullName'])
          .where('c.institutionId = :instId', { instId })
          .orderBy('c.createdAt', 'DESC')
          .take(5)
          .getMany(),
      ]);

    // Full per-month history (ascending). The client picks a year and renders
    // 12 month slots, drawing a bar only for months that have data.
    const issuanceByMonth = monthRows.map((r) => ({
      month: r.month,
      count: Number(r.count),
    }));

    return {
      credentials: {
        total,
        onChain,
        revoked,
        byStatus: byStatusRows.map((r) => ({
          status: r.status,
          count: Number(r.count),
        })),
      },
      issuanceByMonth,
      candidatesReached: Number(reachedRow?.count ?? 0),
      recent: recent.map((c) => ({
        id: c.id,
        title: c.title,
        candidateName: c.candidate?.fullName ?? null,
        status: c.status,
        issuedDate: c.issuedDate
          ? new Date(c.issuedDate).toISOString().slice(0, 10)
          : null,
      })),
      institution: {
        name: institution.name,
        approvalStatus: institution.approvalStatus,
        blockchainAddress: institution.blockchainAddress ?? null,
      },
    };
  }

  async create(
    userId: string,
    dto: CreateInstitutionDto,
  ): Promise<Institution> {
    const existing = await this.repo.findOne({ where: { userId } });
    if (existing) {
      throw new ConflictException('User already has an institution');
    }
    const institution = this.repo.create({ ...dto, userId });
    return this.repo.save(institution);
  }

  async findAll(): Promise<Institution[]> {
    return this.repo
      .createQueryBuilder('inst')
      .leftJoin('inst.user', 'u')
      .addSelect(['u.id', 'u.email', 'u.fullName'])
      .orderBy('inst.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<Institution> {
    const institution = await this.repo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!institution) throw new NotFoundException('Institution not found');
    return institution;
  }

  async findByUserId(userId: string): Promise<Institution> {
    const institution = await this.repo.findOne({ where: { userId } });
    if (!institution) {
      throw new NotFoundException('No institution registered for this user');
    }
    return institution;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateInstitutionDto,
  ): Promise<Institution> {
    const institution = await this.findById(id);
    if (institution.userId !== userId) {
      throw new ForbiddenException('Not the owner of this institution');
    }
    Object.assign(institution, dto);
    return this.repo.save(institution);
  }

  async approve(
    id: string,
    adminId: string,
    dto: ApproveInstitutionDto,
  ): Promise<Institution> {
    const institution = await this.findById(id);

    institution.approvalStatus = dto.approvalStatus;

    if (dto.approvalStatus === ApprovalStatus.APPROVED) {
      institution.approvedBy = adminId;
      institution.approvedAt = new Date();
      institution.rejectionReason = null;
    } else {
      institution.rejectionReason = dto.rejectionReason ?? null;
      institution.approvedBy = adminId;
      institution.approvedAt = new Date();
    }

    const saved = await this.repo.save(institution);

    if (dto.approvalStatus === ApprovalStatus.APPROVED) {
      // On-chain issuer identity is NOT assigned here. Each issuer gets its own
      // distinct identity by connecting their MetaMask wallet (registerIssuerWallet),
      // which authorizes that wallet on-chain (one addIssuer tx per issuer).
      await this.notifications.create({
        userId: saved.userId,
        type: NotificationType.INSTITUTION_APPROVED,
        title: 'Tổ chức được duyệt',
        message: `Tổ chức "${saved.name}" của bạn đã được phê duyệt.`,
        referenceType: 'institution',
        referenceId: saved.id,
      });
    } else if (dto.approvalStatus === ApprovalStatus.REJECTED) {
      await this.notifications.create({
        userId: saved.userId,
        type: NotificationType.INSTITUTION_REJECTED,
        title: 'Tổ chức bị từ chối',
        message:
          saved.rejectionReason ??
          `Tổ chức "${saved.name}" của bạn đã bị từ chối.`,
        referenceType: 'institution',
        referenceId: saved.id,
      });
    }

    await this.auditLogs.record({
      userId: adminId,
      action: `institution.${dto.approvalStatus}`,
      entityType: 'institution',
      entityId: saved.id,
      newValues: {
        approvalStatus: saved.approvalStatus,
        rejectionReason: saved.rejectionReason,
      },
    });

    return saved;
  }
}
