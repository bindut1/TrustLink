import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateEmbedding } from '../../database/entities/candidate-embedding.entity';
import { CandidateProfile } from '../../database/entities/candidate-profile.entity';
import { CandidateSkill } from '../../database/entities/candidate-skill.entity';
import { Credential } from '../../database/entities/credential.entity';
import { CredentialStatus } from '../../database/enums';
import { Job } from '../../database/entities/job.entity';
import { JobEmbedding } from '../../database/entities/job-embedding.entity';
import { AiClientService } from './ai-client.service';

export const EMBEDDING_MODEL_VERSION = 'intfloat/multilingual-e5-small';

// e5 models expect an instruction prefix. We reuse the same stored vector for
// both retrieval directions (job→candidates and candidate→jobs), so we treat
// matching as a symmetric task and prefix BOTH sides with "query: ".
const E5_PREFIX = 'query: ';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(
    private readonly ai: AiClientService,
    @InjectRepository(CandidateEmbedding)
    private readonly candEmbRepo: Repository<CandidateEmbedding>,
    @InjectRepository(JobEmbedding)
    private readonly jobEmbRepo: Repository<JobEmbedding>,
    @InjectRepository(CandidateSkill)
    private readonly skillRepo: Repository<CandidateSkill>,
    @InjectRepository(Credential)
    private readonly credRepo: Repository<Credential>,
    @InjectRepository(CandidateProfile)
    private readonly profileRepo: Repository<CandidateProfile>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
  ) {}

  async updateCandidateEmbedding(candidateId: string): Promise<void> {
    const sourceText = await this.buildCandidateSourceText(candidateId);
    if (!sourceText.trim()) {
      this.logger.debug(
        `Skipping embedding for candidate ${candidateId}: empty source text`,
      );
      return;
    }

    const embedding = await this.ai.encode(E5_PREFIX + sourceText);
    await this.candEmbRepo.upsert(
      {
        candidateId,
        sourceText,
        embedding,
        modelVersion: EMBEDDING_MODEL_VERSION,
      },
      { conflictPaths: ['candidateId'] },
    );
  }

  async updateJobEmbedding(jobId: string): Promise<void> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) {
      this.logger.warn(`Job ${jobId} not found — skipping embedding`);
      return;
    }

    const sourceText = this.buildJobSourceText(job);
    if (!sourceText.trim()) return;

    const embedding = await this.ai.encode(E5_PREFIX + sourceText);
    await this.jobEmbRepo.upsert(
      {
        jobId,
        sourceText,
        embedding,
        modelVersion: EMBEDDING_MODEL_VERSION,
      },
      { conflictPaths: ['jobId'] },
    );
  }

  private async buildCandidateSourceText(candidateId: string): Promise<string> {
    const [skills, credentials, profile] = await Promise.all([
      this.skillRepo.find({ where: { candidateId } }),
      this.credRepo.find({
        where: { candidateId, status: CredentialStatus.ISSUED },
      }),
      this.profileRepo.findOne({ where: { userId: candidateId } }),
    ]);

    const parts: string[] = [];
    if (skills.length > 0) {
      parts.push(`Skills: ${skills.map((s) => s.skillName).join(', ')}`);
    }
    if (credentials.length > 0) {
      parts.push(`Credentials: ${credentials.map((c) => c.title).join('; ')}`);
    }
    if (profile?.desiredPosition) {
      parts.push(`Desired position: ${profile.desiredPosition}`);
    }
    if (profile?.bio) {
      parts.push(`Bio: ${profile.bio}`);
    }
    return parts.join('. ');
  }

  private buildJobSourceText(job: Job): string {
    const parts: string[] = [
      `Title: ${job.title}`,
      `Description: ${job.description}`,
    ];
    if (job.requiredSkills.length > 0) {
      parts.push(`Required skills: ${job.requiredSkills.join(', ')}`);
    }
    if (job.preferredSkills.length > 0) {
      parts.push(`Preferred skills: ${job.preferredSkills.join(', ')}`);
    }
    return parts.join('. ');
  }
}
