import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TxStatus, TxType } from '../enums';
import { Credential } from './credential.entity';
import { Institution } from './institution.entity';
import { User } from './user.entity';

@Entity({ name: 'blockchain_transactions' })
@Index('idx_blockchain_transactions_status', ['status'])
@Index('idx_blockchain_transactions_tx_hash', ['txHash'])
@Index('idx_blockchain_transactions_credential_id', ['credentialId'])
export class BlockchainTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'transaction_type',
    type: 'enum',
    enum: TxType,
    enumName: 'tx_type',
  })
  transactionType: TxType;

  @Column({
    type: 'enum',
    enum: TxStatus,
    enumName: 'tx_status',
    default: TxStatus.QUEUED,
  })
  status: TxStatus;

  @Column({ name: 'credential_id', type: 'uuid', nullable: true })
  credentialId: string | null;

  @ManyToOne(() => Credential, (credential) => credential.blockchainTransactions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'credential_id' })
  credential?: Credential | null;

  @Column({ name: 'institution_id', type: 'uuid', nullable: true })
  institutionId: string | null;

  @ManyToOne(() => Institution, (institution) => institution.blockchainTransactions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'institution_id' })
  institution?: Institution | null;

  @Column({ name: 'initiated_by', type: 'uuid' })
  initiatedBy: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'initiated_by' })
  initiator: User;

  @Column({ name: 'tx_hash', type: 'varchar', length: 66, nullable: true })
  txHash: string | null;

  @Column({ name: 'block_number', type: 'bigint', nullable: true })
  blockNumber: string | null;

  @Column({ name: 'gas_used', type: 'bigint', nullable: true })
  gasUsed: string | null;

  @Column({ name: 'gas_price', type: 'bigint', nullable: true })
  gasPrice: string | null;

  @Column({ type: 'integer', nullable: true })
  nonce: number | null;

  @Column({ name: 'contract_method', type: 'varchar', length: 100 })
  contractMethod: string;

  @Column({
    name: 'contract_params',
    type: 'jsonb',
    default: () => "'{}'::jsonb",
  })
  contractParams: Record<string, unknown>;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'last_error_at', type: 'timestamptz', nullable: true })
  lastErrorAt: Date | null;

  @Column({
    name: 'queued_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  queuedAt: Date;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt: Date | null;

  @Column({ name: 'failed_at', type: 'timestamptz', nullable: true })
  failedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
