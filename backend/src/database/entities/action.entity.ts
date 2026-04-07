import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RoleAction } from './role-action.entity';
import { UserActionOverride } from './user-action-override.entity';

@Entity({ name: 'actions' })
export class Action {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50 })
  module: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => RoleAction, (roleAction) => roleAction.action)
  roleActions?: RoleAction[];

  @OneToMany(() => UserActionOverride, (override) => override.action)
  overrides?: UserActionOverride[];
}
