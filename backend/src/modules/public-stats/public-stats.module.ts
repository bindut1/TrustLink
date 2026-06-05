import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Credential } from '../../database/entities/credential.entity';
import { Institution } from '../../database/entities/institution.entity';
import { User } from '../../database/entities/user.entity';
import { CandidateSkill } from '../../database/entities/candidate-skill.entity';
import { Application } from '../../database/entities/application.entity';
import { PublicStatsController } from './public-stats.controller';
import { PublicStatsService } from './public-stats.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Credential,
      Institution,
      User,
      CandidateSkill,
      Application,
    ]),
  ],
  controllers: [PublicStatsController],
  providers: [PublicStatsService],
})
export class PublicStatsModule {}
