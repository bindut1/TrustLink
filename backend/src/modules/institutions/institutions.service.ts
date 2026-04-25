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
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Institution> {
    const institution = await this.repo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!institution) throw new NotFoundException('Institution not found');
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
      if (saved.blockchainAddress) {
        try {
          await this.blockchain.addIssuerOnChain({
            institutionId: saved.id,
            address: saved.blockchainAddress,
            initiatedBy: adminId,
          });
        } catch (err) {
          this.logger.error(
            `addIssuer on-chain failed for institution ${saved.id}: ${(err as Error).message}`,
          );
        }
      } else {
        this.logger.warn(
          `Institution ${saved.id} approved without a blockchain_address; skipping addIssuer.`,
        );
      }

      await this.notifications.create({
        userId: saved.userId,
        type: NotificationType.INSTITUTION_APPROVED,
        title: 'Institution approved',
        message: `Your institution "${saved.name}" has been approved.`,
        referenceType: 'institution',
        referenceId: saved.id,
      });
    } else if (dto.approvalStatus === ApprovalStatus.REJECTED) {
      await this.notifications.create({
        userId: saved.userId,
        type: NotificationType.INSTITUTION_REJECTED,
        title: 'Institution rejected',
        message:
          saved.rejectionReason ??
          `Your institution "${saved.name}" was rejected.`,
        referenceType: 'institution',
        referenceId: saved.id,
      });
    }

    return saved;
  }
}
