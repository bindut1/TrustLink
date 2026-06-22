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
import { User } from './user.entity';
import { Credential } from './credential.entity';

@Entity({ name: 'candidate_skills' })
@Unique('uq_candidate_skills_candidate_skill', [
  'candidateId',
  'skillNameNormalized',
])
@Index('idx_candidate_skills_candidate_id', ['candidateId'])
@Index('idx_candidate_skills_skill_name_normalized', ['skillNameNormalized'])
export class CandidateSkill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'candidate_id', type: 'uuid' })
  candidateId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate: User;

  @Column({ name: 'skill_name', type: 'varchar', length: 255 })
  skillName: string;

  @Column({ name: 'skill_name_normalized', type: 'varchar', length: 255 })
  skillNameNormalized: string;

  @Column({
    name: 'proficiency_level',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  proficiencyLevel: string | null;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  /**
   * True if the candidate declared this skill themselves. Stays true even after
   * a credential verifies it, so revocation can revert (vs delete) the skill.
   */
  @Column({ name: 'is_self_declared', type: 'boolean', default: false })
  isSelfDeclared: boolean;

  @Column({ name: 'source_credential_id', type: 'uuid', nullable: true })
  sourceCredentialId: string | null;

  @ManyToOne(() => Credential, (credential) => credential.sourcedSkills, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'source_credential_id' })
  sourceCredential?: Credential | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
