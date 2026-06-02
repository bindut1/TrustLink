import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institution } from '../../database/entities/institution.entity';
import { ApprovalStatus, NotificationType } from '../../database/enums';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ApproveInstitutionDto } from './dto/approve-institution.dto';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';

@Injectable()
export class InstitutionsService {
  private readonly logger = new Logger(InstitutionsService.name);

  constructor(
    @InjectRepository(Institution)
    private readonly repo: Repository<Institution>,
    private readonly notifications: NotificationsService,
    private readonly blockchain: BlockchainService,
    private readonly auditLogs: AuditLogsService,
  ) {}

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
      // Auto-assign an on-chain issuer identity so issuers never have to manage
      // an Ethereum wallet. In the MVP the platform's deployer wallet signs
      // every credential, so it is also the authorized issuer — aligning the
      // institution address with it lets VC signature recovery and the on-chain
      // isIssuer check both pass during verification.
      if (!saved.blockchainAddress) {
        const signerAddress = this.blockchain.getSignerAddress();
        if (signerAddress) {
          saved.blockchainAddress = signerAddress;
          await this.repo.save(saved);
        }
      }

      if (saved.blockchainAddress) {
        try {
          // The platform signer only needs to be registered once; skip the
          // redundant (and gas-costing) addIssuer tx if it already is.
          const alreadyAuthorized = await this.blockchain.isIssuerAuthorized(
            saved.blockchainAddress,
          );
          if (!alreadyAuthorized) {
            await this.blockchain.addIssuerOnChain({
              institutionId: saved.id,
              address: saved.blockchainAddress,
              initiatedBy: adminId,
            });
          }
        } catch (err) {
          this.logger.error(
            `addIssuer on-chain failed for institution ${saved.id}: ${(err as Error).message}`,
          );
        }
      } else {
        this.logger.warn(
          `Institution ${saved.id} approved but blockchain signer is not configured; skipping addIssuer.`,
        );
      }

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
