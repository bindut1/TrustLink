import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institution } from '../../database/entities/institution.entity';
import { ApprovalStatus } from '../../database/enums';
import { ApproveInstitutionDto } from './dto/approve-institution.dto';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';

@Injectable()
export class InstitutionsService {
  constructor(
    @InjectRepository(Institution)
    private readonly repo: Repository<Institution>,
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

    return this.repo.save(institution);
  }
}
