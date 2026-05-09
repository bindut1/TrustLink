import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Action } from '../../database/entities/action.entity';
import { BlockchainTransaction } from '../../database/entities/blockchain-transaction.entity';
import { Credential } from '../../database/entities/credential.entity';
import { Institution } from '../../database/entities/institution.entity';
import { RefreshToken } from '../../database/entities/refresh-token.entity';
import { UserActionOverride } from '../../database/entities/user-action-override.entity';
import { User } from '../../database/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Institution,
      Credential,
      BlockchainTransaction,
      Action,
      UserActionOverride,
      RefreshToken,
    ]),
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
