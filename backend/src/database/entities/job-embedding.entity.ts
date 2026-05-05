import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Job } from './job.entity';

@Entity({ name: 'job_embeddings' })
export class JobEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'job_id', type: 'uuid', unique: true })
  jobId: string;

  @OneToOne(() => Job, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ name: 'source_text', type: 'text' })
  sourceText: string;

  @Column({
    name: 'embedding',
    type: 'varchar',
    transformer: {
      to: (value: number[] | null) =>
        value ? `[${value.join(',')}]` : null,
      from: (value: string | null) =>
        value
          ? (value
              .replace(/^\[/, '')
              .replace(/\]$/, '')
              .split(',')
              .map((v) => parseFloat(v)) as number[])
          : null,
    },
  })
  embedding: number[];

  @Column({
    name: 'model_version',
    type: 'varchar',
    length: 100,
    default: 'paraphrase-multilingual-MiniLM-L12-v2',
  })
  modelVersion: string;

  @Column({
    name: 'content_hash',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  contentHash: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
