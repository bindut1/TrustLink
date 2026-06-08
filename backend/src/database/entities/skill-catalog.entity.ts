import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

/** Canonical skill vocabulary; `normalized` is the match key, `aliases` map variants to it. */
@Entity({ name: 'skill_catalog' })
@Unique('uq_skill_catalog_normalized', ['normalized'])
@Index('idx_skill_catalog_aliases', { synchronize: false })
export class SkillCatalog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'normalized', type: 'varchar', length: 255 })
  normalized: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'category', type: 'varchar', length: 64, nullable: true })
  category: string | null;

  @Column({ name: 'aliases', type: 'text', array: true, default: () => "'{}'" })
  aliases: string[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
