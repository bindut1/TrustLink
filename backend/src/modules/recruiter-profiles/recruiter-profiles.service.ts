import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecruiterProfile } from '../../database/entities/recruiter-profile.entity';
import { UpdateRecruiterProfileDto } from './dto/update-recruiter-profile.dto';

@Injectable()
export class RecruiterProfilesService {
  constructor(
    @InjectRepository(RecruiterProfile)
    private readonly repo: Repository<RecruiterProfile>,
  ) {}

  async findById(id: string): Promise<RecruiterProfile> {
    const profile = await this.repo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!profile) throw new NotFoundException('Recruiter profile not found');
    return profile;
  }

  async findByUserId(userId: string): Promise<RecruiterProfile> {
    const profile = await this.repo.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!profile) throw new NotFoundException('Recruiter profile not found');
    return profile;
  }

  async updateByUserId(
    userId: string,
    dto: UpdateRecruiterProfileDto,
  ): Promise<RecruiterProfile> {
    const profile = await this.findByUserId(userId);
    Object.assign(profile, dto);
    return this.repo.save(profile);
  }
}
