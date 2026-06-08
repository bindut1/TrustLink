import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SkillCatalog } from '../../database/entities/skill-catalog.entity';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';

export interface ResolvedSkills {
  tokens: string[]; // canonical tokens, deduped, input order preserved
  unknown: string[]; // inputs not found in the catalog
}

/** Manages the canonical skill catalog and resolves input strings to its tokens. */
@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(SkillCatalog)
    private readonly repo: Repository<SkillCatalog>,
  ) {}

  /** Active catalog entries, ordered for display. */
  async findAll(): Promise<SkillCatalog[]> {
    return this.repo.find({
      where: { isActive: true },
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  /** All entries incl. inactive — admin management view. */
  async findAllAdmin(): Promise<SkillCatalog[]> {
    return this.repo.find({ order: { category: 'ASC', name: 'ASC' } });
  }

  private cleanAliases(aliases: string[] | undefined): string[] {
    if (!Array.isArray(aliases)) return [];
    const out = new Set<string>();
    for (const a of aliases) {
      const v = a.trim().toLowerCase();
      if (v) out.add(v);
    }
    return [...out];
  }

  /** Create a catalog entry (admin). normalized defaults to the lowercased name. */
  async create(dto: CreateSkillDto): Promise<SkillCatalog> {
    const normalized = (dto.normalized ?? dto.name).trim().toLowerCase();
    if (!normalized) throw new BadRequestException('normalized is required');
    const exists = await this.repo.findOne({ where: { normalized } });
    if (exists) {
      throw new ConflictException(`Skill "${normalized}" already exists`);
    }
    const entity = this.repo.create({
      normalized,
      name: dto.name.trim(),
      category: dto.category?.trim() || null,
      aliases: this.cleanAliases(dto.aliases),
      isActive: dto.isActive ?? true,
    });
    return this.repo.save(entity);
  }

  /** Update name/category/aliases/active (normalized is immutable). */
  async update(id: string, dto: UpdateSkillDto): Promise<SkillCatalog> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Skill not found');
    if (dto.name !== undefined) entity.name = dto.name.trim();
    if (dto.category !== undefined) entity.category = dto.category.trim() || null;
    if (dto.aliases !== undefined) entity.aliases = this.cleanAliases(dto.aliases);
    if (dto.isActive !== undefined) entity.isActive = dto.isActive;
    return this.repo.save(entity);
  }

  /** Hard-delete a catalog entry (admin). */
  async remove(id: string): Promise<{ deleted: boolean }> {
    const res = await this.repo.delete({ id });
    if (!res.affected) throw new NotFoundException('Skill not found');
    return { deleted: true };
  }

  /** normalized token + every alias → canonical token. */
  private async buildIndex(): Promise<Map<string, string>> {
    const all = await this.repo.find({ where: { isActive: true } });
    const index = new Map<string, string>();
    for (const s of all) {
      index.set(s.normalized, s.normalized);
      for (const alias of s.aliases ?? []) {
        const a = alias.trim().toLowerCase();
        if (a && !index.has(a)) index.set(a, s.normalized);
      }
    }
    return index;
  }

  /** Resolve free-text skills to canonical tokens; unmatched inputs go to `unknown`. */
  async resolve(inputs: string[] | undefined | null): Promise<ResolvedSkills> {
    const list = Array.isArray(inputs) ? inputs : [];
    if (list.length === 0) return { tokens: [], unknown: [] };

    const index = await this.buildIndex();
    const tokens: string[] = [];
    const unknown: string[] = [];
    const seen = new Set<string>();

    for (const raw of list) {
      if (typeof raw !== 'string') continue;
      const norm = raw.trim().toLowerCase();
      if (!norm) continue;
      const canonical = index.get(norm);
      if (!canonical) {
        unknown.push(raw.trim());
        continue;
      }
      if (!seen.has(canonical)) {
        seen.add(canonical);
        tokens.push(canonical);
      }
    }
    return { tokens, unknown };
  }
}
