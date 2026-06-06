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
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { CredentialStatus } from '../enums';
import { CredentialType } from './credential-type.entity';
import { Institution } from './institution.entity';
import { User } from './user.entity';
import { BatchImport } from './batch-import.entity';
import { VerificationCache } from './verification-cache.entity';
import { BlockchainTransaction } from './blockchain-transaction.entity';
import { CandidateSkill } from './candidate-skill.entity';

@Entity({ name: 'credentials' })
@Unique('uq_credentials_number_institution', [
  'credentialNumber',
  'institutionId',
])
@Index('idx_credentials_candidate_id', ['candidateId'])
@Index('idx_credentials_institution_id', ['institutionId'])
@Index('idx_credentials_status', ['status'])
@Index('idx_credentials_credential_hash', ['credentialHash'])
export class Credential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'credential_number', type: 'varchar', length: 100 })
  credentialNumber: string;

  @Column({ name: 'credential_type_id', type: 'uuid', nullable: true })
  credentialTypeId: string | null;

  @ManyToOne(() => CredentialType, (type) => type.credentials, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'credential_type_id' })
  credentialType?: CredentialType | null;

  @Column({ name: 'institution_id', type: 'uuid', nullable: true })
  institutionId: string | null;

  @ManyToOne(() => Institution, (institution) => institution.credentials, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'institution_id' })
  institution?: Institution | null;

  @Column({ name: 'candidate_id', type: 'uuid', nullable: true })
  candidateId: string | null;

  @ManyToOne(() => User, (user) => user.credentials, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'candidate_id' })
  candidate?: User | null;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ name: 'issued_date', type: 'date' })
  issuedDate: Date;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: Date | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @Column({
    name: 'extracted_skills',
    type: 'text',
    array: true,
    default: () => "'{}'::text[]",
  })
  extractedSkills: string[];

  @Column({
    type: 'enum',
    enum: CredentialStatus,
    enumName: 'credential_status',
    default: CredentialStatus.PENDING,
  })
  status: CredentialStatus;

  @Column({
    name: 'credential_hash',
    type: 'varchar',
    length: 66,
    nullable: true,
  })
  credentialHash: string | null;

  // Which hashing scheme produced `credential_hash`. Lets verification stay
  // backward-compatible: legacy rows (null) use plain JSON.stringify, new rows
  // use canonical JCS-style serialization. See BlockchainService.computeCredentialHash.
  @Column({ name: 'hash_version', type: 'varchar', length: 16, nullable: true })
  hashVersion: string | null;

  @Column({
    name: 'blockchain_tx_hash',
    type: 'varchar',
    length: 66,
    nullable: true,
  })
  blockchainTxHash: string | null;

  @Column({
    name: 'blockchain_block_number',
    type: 'bigint',
    nullable: true,
  })
  blockchainBlockNumber: string | null;

  @Column({
    name: 'blockchain_timestamp',
    type: 'timestamptz',
    nullable: true,
  })
  blockchainTimestamp: Date | null;

  // Merkle batching (Blockcerts-style): the credential's canonical hash is a
  // leaf under `merkle_root`, which is what gets anchored on-chain. `merkle_proof`
  // proves this leaf belongs to that root; `leaf_index` is its position.
  @Column({
    name: 'merkle_root',
    type: 'varchar',
    length: 66,
    nullable: true,
  })
  merkleRoot: string | null;

  @Column({
    name: 'merkle_proof',
    type: 'jsonb',
    nullable: true,
  })
  merkleProof: string[] | null;

  @Column({ name: 'leaf_index', type: 'int', nullable: true })
  leafIndex: number | null;

  @Column({ name: 'vc_jwt', type: 'text', nullable: true })
  vcJwt: string | null;

  @Column({ name: 'vc_json', type: 'jsonb', nullable: true })
  vcJson: Record<string, unknown> | null;

  @Column({ name: 'issuer_did', type: 'varchar', length: 500, nullable: true })
  issuerDid: string | null;

  @Column({ name: 'digital_signature', type: 'text', nullable: true })
  digitalSignature: string | null;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({ name: 'revocation_reason', type: 'text', nullable: true })
  revocationReason: string | null;

  @Column({ name: 'reissued_from_id', type: 'uuid', nullable: true })
  reissuedFromId: string | null;

  @OneToOne(() => Credential, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reissued_from_id' })
  reissuedFrom?: Credential | null;

  @Column({ name: 'reissued_to_id', type: 'uuid', nullable: true })
  reissuedToId: string | null;

  @OneToOne(() => Credential, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reissued_to_id' })
  reissuedTo?: Credential | null;

  @Column({ name: 'batch_import_id', type: 'uuid', nullable: true })
  batchImportId: string | null;

  @ManyToOne(() => BatchImport, (batch) => batch.credentials, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'batch_import_id' })
  batchImport?: BatchImport | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => VerificationCache, (cache) => cache.credential)
  verificationCaches?: VerificationCache[];

  @OneToMany(() => BlockchainTransaction, (tx) => tx.credential)
  blockchainTransactions?: BlockchainTransaction[];

  @OneToMany(() => CandidateSkill, (skill) => skill.sourceCredential)
  sourcedSkills?: CandidateSkill[];
}
