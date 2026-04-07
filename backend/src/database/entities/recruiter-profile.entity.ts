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

@Entity({ name: 'recruiter_profiles' })
export class RecruiterProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.recruiterProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'company_name', type: 'varchar', length: 500 })
  companyName: string;

  @Column({
    name: 'company_name_en',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  companyNameEn: string | null;

  @Column({
    name: 'company_logo_url',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  companyLogoUrl: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  industry: string | null;

  @Column({ name: 'company_size', type: 'varchar', length: 50, nullable: true })
  companySize: string | null;

  @Column({
    name: 'company_website',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  companyWebsite: string | null;

  @Column({ name: 'company_address', type: 'text', nullable: true })
  companyAddress: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 100, default: 'Vietnam' })
  country: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'tax_code', type: 'varchar', length: 50, nullable: true })
  taxCode: string | null;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
