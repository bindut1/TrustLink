import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ApplicationStatus } from '../enums';
import { Job } from './job.entity';
import { User } from './user.entity';

@Entity({ name: 'applications' })
@Unique('uq_applications_job_candidate', ['jobId', 'candidateId'])
@Index('idx_applications_job_id', ['jobId'])
@Index('idx_applications_candidate_id', ['candidateId'])
@Index('idx_applications_status', ['status'])
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'job_id', type: 'uuid' })
  jobId: string;

  @ManyToOne(() => Job, (job) => job.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ name: 'candidate_id', type: 'uuid' })
  candidateId: string;

  @ManyToOne(() => User, (user) => user.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate: User;

  @Column({ name: 'cover_letter', type: 'text', nullable: true })
  coverLetter: string | null;

  @Column({ name: 'resume_url', type: 'varchar', length: 500, nullable: true })
  resumeUrl: string | null;

  @Column({
    name: 'match_score',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  matchScore: string | null;

  @Column({
    name: 'keyword_score',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  keywordScore: string | null;

  @Column({
    name: 'semantic_score',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  semanticScore: string | null;

  @Column({
    name: 'verified_bonus',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  verifiedBonus: string | null;

  @Column({
    name: 'score_breakdown',
    type: 'jsonb',
    default: () => "'{}'::jsonb",
  })
  scoreBreakdown: Record<string, unknown>;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    enumName: 'application_status',
    default: ApplicationStatus.APPLIED,
  })
  status: ApplicationStatus;

  @Column({ name: 'status_changed_at', type: 'timestamptz', nullable: true })
  statusChangedAt: Date | null;

  @Column({ name: 'recruiter_notes', type: 'text', nullable: true })
  recruiterNotes: string | null;

  @Column({ name: 'credentials_verified', type: 'boolean', default: false })
  credentialsVerified: boolean;

  @Column({
    name: 'verified_credential_ids',
    type: 'uuid',
    array: true,
    default: () => "'{}'::uuid[]",
  })
  verifiedCredentialIds: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
