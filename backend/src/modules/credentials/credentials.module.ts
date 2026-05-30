import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateSkill } from '../../database/entities/candidate-skill.entity';
import { CredentialType } from '../../database/entities/credential-type.entity';
import { Credential } from '../../database/entities/credential.entity';
import { Institution } from '../../database/entities/institution.entity';
import { User } from '../../database/entities/user.entity';
import { VerificationCache } from '../../database/entities/verification-cache.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CredentialsController } from './credentials.controller';
import { CredentialsService } from './credentials.service';
import { PublicCredentialsController } from './public-credentials.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Credential,
      CredentialType,
      Institution,
      User,
      CandidateSkill,
      VerificationCache,
    ]),
    AuthModule,
    NotificationsModule,
    BlockchainModule,
    AuditLogsModule,
  ],
  controllers: [CredentialsController, PublicCredentialsController],
  providers: [CredentialsService],
  exports: [CredentialsService],
})
export class CredentialsModule {}
