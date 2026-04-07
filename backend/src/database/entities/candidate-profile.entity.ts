import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'candidate_profiles' })
export class CandidateProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.candidateProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ name: 'resume_url', type: 'varchar', length: 500, nullable: true })
  resumeUrl: string | null;

  @Column({ name: 'linkedin_url', type: 'varchar', length: 500, nullable: true })
  linkedinUrl: string | null;

  @Column({ name: 'github_url', type: 'varchar', length: 500, nullable: true })
  githubUrl: string | null;

  @Column({
    name: 'portfolio_url',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  portfolioUrl: string | null;

  @Column({ name: 'years_of_experience', type: 'smallint', default: 0 })
  yearsOfExperience: number;

  @Column({
    name: 'desired_position',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  desiredPosition: string | null;

  @Column({ name: 'desired_salary_min', type: 'integer', nullable: true })
  desiredSalaryMin: number | null;

  @Column({ name: 'desired_salary_max', type: 'integer', nullable: true })
  desiredSalaryMax: number | null;

  @Column({
    name: 'preferred_locations',
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  preferredLocations: unknown;

  @Column({ name: 'is_open_to_work', type: 'boolean', default: true })
  isOpenToWork: boolean;

  @Column({ name: 'profile_completeness', type: 'smallint', default: 0 })
  profileCompleteness: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
