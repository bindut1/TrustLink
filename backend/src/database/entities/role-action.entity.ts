import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UserRole } from '../enums';
import { Action } from './action.entity';

@Entity({ name: 'role_actions' })
@Unique('uq_role_actions_role_action', ['role', 'actionId'])
export class RoleAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: UserRole, enumName: 'user_role' })
  role: UserRole;

  @Column({ name: 'action_id', type: 'uuid' })
  actionId: string;

  @ManyToOne(() => Action, (action) => action.roleActions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'action_id' })
  action: Action;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
