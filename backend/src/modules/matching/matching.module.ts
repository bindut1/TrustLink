import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateEmbedding } from '../../database/entities/candidate-embedding.entity';
import { CandidateProfile } from '../../database/entities/candidate-profile.entity';
import { CandidateSkill } from '../../database/entities/candidate-skill.entity';
import { Credential } from '../../database/entities/credential.entity';
import { Job } from '../../database/entities/job.entity';
import { JobEmbedding } from '../../database/entities/job-embedding.entity';
import { User } from '../../database/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { AiClientService } from './ai-client.service';
import { EmbeddingService } from './embedding.service';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CandidateEmbedding,
      JobEmbedding,
      CandidateSkill,
      Credential,
      CandidateProfile,
      Job,
      User,
    ]),
    AuthModule,
  ],
  controllers: [MatchingController],
  providers: [AiClientService, EmbeddingService, MatchingService],
  exports: [EmbeddingService, MatchingService],
})
export class MatchingModule {}
