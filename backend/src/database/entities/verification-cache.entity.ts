import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { VerificationResult } from '../enums';
import { Credential } from './credential.entity';
import { User } from './user.entity';

@Entity({ name: 'verification_cache' })
@Index('idx_verification_cache_credential_id', ['credentialId'])
@Index('idx_verification_cache_expires_at', ['expiresAt'])
export class VerificationCache {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'credential_id', type: 'uuid', nullable: true })
  credentialId: string | null;

  @ManyToOne(() => Credential, (credential) => credential.verificationCaches, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'credential_id' })
  credential?: Credential | null;

  @Column({ name: 'credential_hash', type: 'varchar', length: 66 })
  credentialHash: string;

  @Column({
    type: 'enum',
    enum: VerificationResult,
    enumName: 'verification_result',
  })
  result: VerificationResult;

  @Column({ name: 'on_chain_verified', type: 'boolean', default: false })
  onChainVerified: boolean;

  @Column({ name: 'vc_signature_valid', type: 'boolean', default: false })
  vcSignatureValid: boolean;

  @Column({ name: 'issuer_authorized', type: 'boolean', default: false })
  issuerAuthorized: boolean;

  @Column({
    name: 'verification_details',
    type: 'jsonb',
    default: () => "'{}'::jsonb",
  })
  verificationDetails: Record<string, unknown>;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'verified_by' })
  verifier?: User | null;

  @Column({
    name: 'verified_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  verifiedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
