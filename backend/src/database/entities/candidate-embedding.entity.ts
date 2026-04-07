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

@Entity({ name: 'candidate_embeddings' })
export class CandidateEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'candidate_id', type: 'uuid', unique: true })
  candidateId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate: User;

  @Column({ name: 'source_text', type: 'text' })
  sourceText: string;

  // pgvector type — typeorm does not natively know about it, so we use a string
  // column type and let the migration declare it as `vector(384)`. Use the
  // `pgvector` npm helper at runtime when reading/writing.
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
    default: 'all-MiniLM-L6-v2',
  })
  modelVersion: string;

  @Column({
    name: 'credentials_hash',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  credentialsHash: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
