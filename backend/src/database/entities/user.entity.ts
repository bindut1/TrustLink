import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AccountStatus, UserRole } from '../enums';
import { Institution } from './institution.entity';
import { CandidateProfile } from './candidate-profile.entity';
import { RecruiterProfile } from './recruiter-profile.entity';
import { RefreshToken } from './refresh-token.entity';
import { PasswordResetToken } from './password-reset-token.entity';
import { UserActionOverride } from './user-action-override.entity';
import { Credential } from './credential.entity';
import { Job } from './job.entity';
import { Application } from './application.entity';
import { Notification } from './notification.entity';

@Entity({ name: 'users' })
@Index('idx_users_role', ['role'])
@Index('idx_users_status', ['status'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Exclude()
  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, enumName: 'user_role' })
  role: UserRole;

  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @Column({
    type: 'enum',
    enum: AccountStatus,
    enumName: 'account_status',
    default: AccountStatus.ACTIVE,
  })
  status: AccountStatus;

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => Institution, (institution) => institution.user)
  institution?: Institution;

  @OneToOne(() => CandidateProfile, (profile) => profile.user)
  candidateProfile?: CandidateProfile;

  @OneToOne(() => RecruiterProfile, (profile) => profile.user)
  recruiterProfile?: RecruiterProfile;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens?: RefreshToken[];

  @OneToMany(() => PasswordResetToken, (token) => token.user)
  passwordResetTokens?: PasswordResetToken[];

  @OneToMany(() => UserActionOverride, (override) => override.user)
  actionOverrides?: UserActionOverride[];

  @OneToMany(() => Credential, (credential) => credential.candidate)
  credentials?: Credential[];

  @OneToMany(() => Job, (job) => job.recruiter)
  jobs?: Job[];

  @OneToMany(() => Application, (application) => application.candidate)
  applications?: Application[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications?: Notification[];
}
