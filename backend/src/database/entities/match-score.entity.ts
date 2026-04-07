import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Job } from './job.entity';
import { User } from './user.entity';

@Entity({ name: 'match_scores' })
@Unique('uq_match_scores_candidate_job', ['candidateId', 'jobId'])
@Index('idx_match_scores_total_score', ['totalScore'])
@Index('idx_match_scores_is_stale', ['isStale'])
export class MatchScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'candidate_id', type: 'uuid' })
  candidateId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate: User;

  @Column({ name: 'job_id', type: 'uuid' })
  jobId: string;

  @ManyToOne(() => Job, (job) => job.matchScores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({
    name: 'keyword_score',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
  })
  keywordScore: string;

  @Column({
    name: 'semantic_score',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
  })
  semanticScore: string;

  @Column({
    name: 'verified_bonus',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
  })
  verifiedBonus: string;

  @Column({
    name: 'total_score',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
  })
  totalScore: string;

  @Column({
    name: 'computed_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  computedAt: Date;

  @Column({ name: 'is_stale', type: 'boolean', default: false })
  isStale: boolean;
}
