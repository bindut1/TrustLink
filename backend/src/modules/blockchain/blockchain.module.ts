import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockchainTransaction } from '../../database/entities/blockchain-transaction.entity';
import { Credential } from '../../database/entities/credential.entity';
import { Institution } from '../../database/entities/institution.entity';
import { User } from '../../database/entities/user.entity';
import { BLOCKCHAIN_QUEUE } from './blockchain.constants';
import { BlockchainProcessor } from './blockchain.processor';
import { BlockchainReconciliationService } from './blockchain-reconciliation.service';
import { BlockchainService } from './blockchain.service';
import { VcService } from './vc.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BlockchainTransaction,
      Credential,
      Institution,
      User,
    ]),
    BullModule.registerQueue({ name: BLOCKCHAIN_QUEUE }),
  ],
  providers: [
    BlockchainService,
    BlockchainProcessor,
    BlockchainReconciliationService,
    VcService,
  ],
  exports: [BlockchainService, VcService],
})
export class BlockchainModule {}
