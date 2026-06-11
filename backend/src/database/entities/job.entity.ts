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
import { JobStatus } from '../enums';
import { User } from './user.entity';
import { Application } from './application.entity';

@Entity({ name: 'jobs' })
@Index('idx_jobs_recruiter_id', ['recruiterId'])
@Index('idx_jobs_status', ['status'])
@Index('idx_jobs_city', ['city'])
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recruiter_id', type: 'uuid' })
  recruiterId: string;

  @ManyToOne(() => User, (user) => user.jobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recruiter_id' })
  recruiter: User;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  requirements: string | null;

  @Column({ type: 'text', nullable: true })
  benefits: string | null;

  @Column({ name: 'job_type', type: 'varchar', length: 50, default: 'full_time' })
  jobType: string;

  @Column({
    name: 'experience_level',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  experienceLevel: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  industry: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ name: 'is_remote', type: 'boolean', default: false })
  isRemote: boolean;

  @Column({ name: 'salary_min', type: 'integer', nullable: true })
  salaryMin: number | null;

  @Column({ name: 'salary_max', type: 'integer', nullable: true })
  salaryMax: number | null;

  @Column({ name: 'salary_visible', type: 'boolean', default: true })
  salaryVisible: boolean;

  @Column({
    name: 'required_skills',
    type: 'text',
    array: true,
    default: () => "'{}'::text[]",
  })
  requiredSkills: string[];

  @Column({
    name: 'preferred_skills',
    type: 'text',
    array: true,
    default: () => "'{}'::text[]",
  })
  preferredSkills: string[];

  @Column({
    name: 'required_credential_types',
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  requiredCredentialTypes: unknown;

  @Column({
    type: 'enum',
    enum: JobStatus,
    enumName: 'job_status',
    default: JobStatus.DRAFT,
  })
  status: JobStatus;

  @Column({ name: 'application_deadline', type: 'date', nullable: true })
  applicationDeadline: Date | null;

  @Column({ name: 'max_applications', type: 'integer', nullable: true })
  maxApplications: number | null;

  @Column({ name: 'view_count', type: 'integer', default: 0 })
  viewCount: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Application, (application) => application.job)
  applications?: Application[];
}
