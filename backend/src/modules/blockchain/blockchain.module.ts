import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockchainTransaction } from '../../database/entities/blockchain-transaction.entity';
import { CandidateSkill } from '../../database/entities/candidate-skill.entity';
import { Credential } from '../../database/entities/credential.entity';
import { Institution } from '../../database/entities/institution.entity';
import { User } from '../../database/entities/user.entity';
import { MatchingModule } from '../matching/matching.module';
import { BlockchainReconciliationService } from './blockchain-reconciliation.service';
import { BlockchainService } from './blockchain.service';
import { VcService } from './vc.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BlockchainTransaction,
      CandidateSkill,
      Credential,
      Institution,
      User,
    ]),
    MatchingModule,
  ],
  providers: [
    BlockchainService,
    BlockchainReconciliationService,
    VcService,
  ],
  exports: [BlockchainService, VcService],
})
export class BlockchainModule {}
