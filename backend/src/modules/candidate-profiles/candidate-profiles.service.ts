import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateProfile } from '../../database/entities/candidate-profile.entity';
import { EmbeddingService } from '../matching/embedding.service';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';

@Injectable()
export class CandidateProfilesService {
  private readonly logger = new Logger(CandidateProfilesService.name);

  constructor(
    @InjectRepository(CandidateProfile)
    private readonly repo: Repository<CandidateProfile>,
    private readonly embeddings: EmbeddingService,
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
    const saved = await this.repo.save(profile);

    // Bio + desired_position feed into the embedding source text, so refresh
    // when those change. Best-effort: AI service downtime must not block the
    // candidate from saving their profile.
    try {
      await this.embeddings.updateCandidateEmbedding(userId);
    } catch (err) {
      this.logger.warn(
        `Failed to refresh embedding for candidate ${userId}: ${(err as Error).message}`,
      );
    }

    return saved;
  }
}
