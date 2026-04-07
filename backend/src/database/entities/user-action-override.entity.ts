import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Action } from './action.entity';
import { User } from './user.entity';

@Entity({ name: 'user_action_overrides' })
@Unique('uq_user_action_overrides_user_action', ['userId', 'actionId'])
export class UserActionOverride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.actionOverrides, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'action_id', type: 'uuid' })
  actionId: string;

  @ManyToOne(() => Action, (action) => action.overrides, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'action_id' })
  action: Action;

  @Column({ name: 'is_enabled', type: 'boolean' })
  isEnabled: boolean;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ name: 'overridden_by', type: 'uuid', nullable: true })
  overriddenBy: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'overridden_by' })
  overrider?: User | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
