import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateProfile } from '../../database/entities/candidate-profile.entity';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';

@Injectable()
export class CandidateProfilesService {
  constructor(
    @InjectRepository(CandidateProfile)
    private readonly repo: Repository<CandidateProfile>,
  ) {}

  async findById(id: string): Promise<CandidateProfile> {
    const profile = await this.repo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!profile) throw new NotFoundException('Candidate profile not found');
    return profile;
  }

  async findByUserId(userId: string): Promise<CandidateProfile> {
    const profile = await this.repo.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!profile) throw new NotFoundException('Candidate profile not found');
    return profile;
  }

  async updateByUserId(
    userId: string,
    dto: UpdateCandidateProfileDto,
  ): Promise<CandidateProfile> {
    const profile = await this.findByUserId(userId);
    Object.assign(profile, dto);
    return this.repo.save(profile);
  }
}
