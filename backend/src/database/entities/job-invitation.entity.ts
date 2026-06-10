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
import { JobInvitationStatus } from '../enums';
import { Job } from './job.entity';
import { User } from './user.entity';

/**
 * A recruiter's invitation ("offer") asking a candidate to apply to one of
 * their jobs. Surfaced in the candidate's "Lời mời" inbox. Whether the
 * candidate has actually applied is derived from the applications table at read
 * time — this row only tracks the invite itself (message + pending/declined).
 */
@Entity({ name: 'job_invitations' })
@Unique('uq_job_invitations_job_candidate', ['jobId', 'candidateId'])
@Index('idx_job_invitations_candidate_id', ['candidateId'])
@Index('idx_job_invitations_job_id', ['jobId'])
export class JobInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'job_id', type: 'uuid' })
  jobId: string;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ name: 'candidate_id', type: 'uuid' })
  candidateId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate: User;

  @Column({ name: 'recruiter_id', type: 'uuid' })
  recruiterId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recruiter_id' })
  recruiter: User;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({
    type: 'enum',
    enum: JobInvitationStatus,
    enumName: 'job_invitation_status',
    default: JobInvitationStatus.PENDING,
  })
  status: JobInvitationStatus;

  @Column({ name: 'decline_reason', type: 'text', nullable: true })
  declineReason: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
