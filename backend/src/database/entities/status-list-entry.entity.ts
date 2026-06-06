import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

/**
 * One bit of a StatusList2021 revocation list. Each issued credential is
 * assigned an index in a status list; `revoked=true` flips its bit. The public
 * StatusList2021Credential is rebuilt from these rows.
 */
@Entity({ name: 'status_list_entries' })
@Unique('uq_status_list_entry_slot', ['statusListId', 'statusListIndex'])
@Index('idx_status_list_entry_credential', ['credentialId'])
export class StatusListEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'credential_id', type: 'uuid' })
  credentialId: string;

  @Column({ name: 'status_list_id', type: 'int', default: 1 })
  statusListId: number;

  @Column({ name: 'status_list_index', type: 'int' })
  statusListIndex: number;

  @Column({ type: 'boolean', default: false })
  revoked: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
