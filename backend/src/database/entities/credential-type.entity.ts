import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CredentialCategory } from '../enums';
import { Credential } from './credential.entity';
import { BatchImport } from './batch-import.entity';

@Entity({ name: 'credential_types' })
export class CredentialType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: CredentialCategory,
    enumName: 'credential_category',
  })
  category: CredentialCategory;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'name_en', type: 'varchar', length: 255, nullable: true })
  nameEn: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'field_schema', type: 'jsonb' })
  fieldSchema: Record<string, unknown>;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Credential, (credential) => credential.credentialType)
  credentials?: Credential[];

  @OneToMany(() => BatchImport, (batch) => batch.credentialType)
  batchImports?: BatchImport[];
}
