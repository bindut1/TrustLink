import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchImport } from '../../database/entities/batch-import.entity';
import { CredentialType } from '../../database/entities/credential-type.entity';
import { Credential } from '../../database/entities/credential.entity';
import { Institution } from '../../database/entities/institution.entity';
import { User } from '../../database/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { CredentialsModule } from '../credentials/credentials.module';
import { BatchImportRunner } from './batch-import.runner';
import { BATCH_IMPORT_QUEUE } from './batch-imports.constants';
import { BatchImportsController } from './batch-imports.controller';
import { BatchImportsProcessor } from './batch-imports.processor';
import { BatchImportsService } from './batch-imports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BatchImport,
      Credential,
      CredentialType,
      Institution,
      User,
    ]),
    BullModule.registerQueue({ name: BATCH_IMPORT_QUEUE }),
    AuthModule,
    CredentialsModule,
  ],
  controllers: [BatchImportsController],
  providers: [BatchImportsService, BatchImportRunner, BatchImportsProcessor],
  exports: [BatchImportsService],
})
export class BatchImportsModule {}
