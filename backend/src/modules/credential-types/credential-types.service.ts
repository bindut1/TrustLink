import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CredentialType } from '../../database/entities/credential-type.entity';
import { CreateCredentialTypeDto } from './dto/create-credential-type.dto';
import { UpdateCredentialTypeDto } from './dto/update-credential-type.dto';

@Injectable()
export class CredentialTypesService {
  constructor(
    @InjectRepository(CredentialType)
    private readonly repo: Repository<CredentialType>,
  ) {}

  async findAllActive(): Promise<CredentialType[]> {
    return this.repo.find({
      where: { isActive: true },
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async findById(id: string): Promise<CredentialType> {
    const type = await this.repo.findOne({ where: { id } });
    if (!type) throw new NotFoundException('Credential type not found');
    return type;
  }

  async create(dto: CreateCredentialTypeDto): Promise<CredentialType> {
    const type = this.repo.create(dto);
    return this.repo.save(type);
  }

  async update(
    id: string,
    dto: UpdateCredentialTypeDto,
  ): Promise<CredentialType> {
    const type = await this.findById(id);
    Object.assign(type, dto);
    return this.repo.save(type);
  }
}
