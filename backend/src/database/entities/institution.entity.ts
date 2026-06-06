import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApprovalStatus } from '../enums';
import { User } from './user.entity';
import { Credential } from './credential.entity';
import { BatchImport } from './batch-import.entity';
import { BlockchainTransaction } from './blockchain-transaction.entity';

@Entity({ name: 'institutions' })
@Index('idx_institutions_approval_status', ['approvalStatus'])
export class Institution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.institution, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 500 })
  name: string;

  @Column({ name: 'name_en', type: 'varchar', length: 500, nullable: true })
  nameEn: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  abbreviation: string | null;

  @Column({ name: 'institution_type', type: 'varchar', length: 100 })
  institutionType: string;

  @Column({ name: 'tax_code', type: 'varchar', length: 50, nullable: true })
  taxCode: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  website: string | null;

  @Column({ name: 'logo_url', type: 'varchar', length: 500, nullable: true })
  logoUrl: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 100, default: 'Vietnam' })
  country: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    name: 'approval_status',
    type: 'enum',
    enum: ApprovalStatus,
    enumName: 'approval_status',
    default: ApprovalStatus.PENDING,
  })
  approvalStatus: ApprovalStatus;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by' })
  approver?: User | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({
    name: 'blockchain_address',
    type: 'varchar',
    length: 42,
    nullable: true,
  })
  blockchainAddress: string | null;

  // The institution's own (non-custodial) signing address — the MetaMask wallet
  // that signs VCs (EthereumEip712Signature2021) and broadcasts batch anchors.
  // Verification recovers the signer from the VC proof and matches it here.
  @Column({
    name: 'signing_address',
    type: 'varchar',
    length: 42,
    nullable: true,
  })
  signingAddress: string | null;

  @Column({
    name: 'did_identifier',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  didIdentifier: string | null;

  @Column({ name: 'signing_public_key', type: 'text', nullable: true })
  signingPublicKey: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Credential, (credential) => credential.institution)
  credentials?: Credential[];

  @OneToMany(() => BatchImport, (batch) => batch.institution)
  batchImports?: BatchImport[];

  @OneToMany(() => BlockchainTransaction, (tx) => tx.institution)
  blockchainTransactions?: BlockchainTransaction[];
}
