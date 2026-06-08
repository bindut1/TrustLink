import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateSkill } from '../../database/entities/candidate-skill.entity';
import { CredentialType } from '../../database/entities/credential-type.entity';
import { Credential } from '../../database/entities/credential.entity';
import { Institution } from '../../database/entities/institution.entity';
import { User } from '../../database/entities/user.entity';
import { VerificationCache } from '../../database/entities/verification-cache.entity';
import { StatusListEntry } from '../../database/entities/status-list-entry.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SkillsModule } from '../skills/skills.module';
import { CredentialsController } from './credentials.controller';
import { CredentialsService } from './credentials.service';
import { PublicCredentialsController } from './public-credentials.controller';
import { StatusListController } from './status-list.controller';
import { StatusListService } from './status-list.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Credential,
      CredentialType,
      Institution,
      User,
      CandidateSkill,
      VerificationCache,
      StatusListEntry,
    ]),
    AuthModule,
    NotificationsModule,
    BlockchainModule,
    AuditLogsModule,
    SkillsModule,
  ],
  controllers: [
    CredentialsController,
    PublicCredentialsController,
    StatusListController,
  ],
  providers: [CredentialsService, StatusListService],
  exports: [CredentialsService, StatusListService],
})
export class CredentialsModule {}
