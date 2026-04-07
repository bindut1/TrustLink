import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BatchStatus } from '../enums';
import { Institution } from './institution.entity';
import { User } from './user.entity';
import { CredentialType } from './credential-type.entity';
import { Credential } from './credential.entity';

@Entity({ name: 'batch_imports' })
@Index('idx_batch_imports_institution_id', ['institutionId'])
@Index('idx_batch_imports_status', ['status'])
export class BatchImport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'institution_id', type: 'uuid', nullable: true })
  institutionId: string | null;

  @ManyToOne(() => Institution, (institution) => institution.batchImports, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'institution_id' })
  institution?: Institution | null;

  @Column({ name: 'initiated_by', type: 'uuid', nullable: true })
  initiatedBy: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'initiated_by' })
  initiator?: User | null;

  @Column({ name: 'credential_type_id', type: 'uuid', nullable: true })
  credentialTypeId: string | null;

  @ManyToOne(() => CredentialType, (type) => type.batchImports, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'credential_type_id' })
  credentialType?: CredentialType | null;

  @Column({ name: 'original_filename', type: 'varchar', length: 500 })
  originalFilename: string;

  @Column({ name: 'file_url', type: 'varchar', length: 500, nullable: true })
  fileUrl: string | null;

  @Column({
    type: 'enum',
    enum: BatchStatus,
    enumName: 'batch_status',
    default: BatchStatus.UPLOADING,
  })
  status: BatchStatus;

  @Column({ name: 'total_rows', type: 'integer', default: 0 })
  totalRows: number;

  @Column({ name: 'processed_rows', type: 'integer', default: 0 })
  processedRows: number;

  @Column({ name: 'success_count', type: 'integer', default: 0 })
  successCount: number;

  @Column({ name: 'error_count', type: 'integer', default: 0 })
  errorCount: number;

  @Column({
    name: 'error_report',
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  errorReport: unknown;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Credential, (credential) => credential.batchImport)
  credentials?: Credential[];
}
