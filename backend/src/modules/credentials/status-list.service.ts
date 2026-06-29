import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { gzipSync } from 'zlib';
import { DataSource, Repository } from 'typeorm';
import { StatusListEntry } from '../../database/entities/status-list-entry.entity';

const STATUS_LIST_BITS = 131072;
const DEFAULT_LIST_ID = 1;

export interface CredentialStatus {
  id: string;
  type: 'StatusList2021Entry';
  statusPurpose: 'revocation';
  statusListIndex: string;
  statusListCredential: string;
}

@Injectable()
export class StatusListService {
  constructor(
    @InjectRepository(StatusListEntry)
    private readonly repo: Repository<StatusListEntry>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  private baseUrl(): string {
    return (this.config.get<string>('PUBLIC_API_URL') ?? '').replace(
      /\/+$/,
      '',
    );
  }

  async assignEntry(
    credentialId: string,
    statusListId = DEFAULT_LIST_ID,
  ): Promise<StatusListEntry> {
    const existing = await this.repo.findOne({ where: { credentialId } });
    if (existing) return existing;

    for (let attempt = 0; attempt < 5; attempt++) {
      const row = await this.repo
        .createQueryBuilder('e')
        .select('COALESCE(MAX(e.status_list_index), -1)', 'max')
        .where('e.status_list_id = :id', { id: statusListId })
        .getRawOne<{ max: string }>();
      const nextIndex = parseInt(row?.max ?? '-1', 10) + 1;
      try {
        return await this.repo.save(
          this.repo.create({
            credentialId,
            statusListId,
            statusListIndex: nextIndex,
            revoked: false,
          }),
        );
      } catch (err) {
        if ((err as { code?: string }).code === '23505' && attempt < 4) {
          continue;
        }
        throw err;
      }
    }
    throw new Error('Could not assign a status-list slot');
  }

  async revokeByCredential(credentialId: string): Promise<void> {
    await this.repo.update({ credentialId }, { revoked: true });
  }

  async isRevoked(credentialId: string): Promise<boolean> {
    const entry = await this.repo.findOne({ where: { credentialId } });
    return entry?.revoked ?? false;
  }

  buildCredentialStatus(entry: StatusListEntry): CredentialStatus {
    const listUrl = `${this.baseUrl()}/status-list/${entry.statusListId}`;
    return {
      id: `${listUrl}#${entry.statusListIndex}`,
      type: 'StatusList2021Entry',
      statusPurpose: 'revocation',
      statusListIndex: String(entry.statusListIndex),
      statusListCredential: listUrl,
    };
  }

  async buildStatusListCredential(
    statusListId = DEFAULT_LIST_ID,
  ): Promise<Record<string, unknown>> {
    const revoked = await this.repo.find({
      where: { statusListId, revoked: true },
    });

    const bytes = new Uint8Array(STATUS_LIST_BITS / 8);
    for (const e of revoked) {
      if (e.statusListIndex < 0 || e.statusListIndex >= STATUS_LIST_BITS) {
        continue;
      }
      const byte = e.statusListIndex >> 3;
      bytes[byte] |= 0x80 >> (e.statusListIndex & 7);
    }
    const encodedList = gzipSync(Buffer.from(bytes)).toString('base64url');

    const listUrl = `${this.baseUrl()}/status-list/${statusListId}`;
    return {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/vc/status-list/2021/v1',
      ],
      id: listUrl,
      type: ['VerifiableCredential', 'StatusList2021Credential'],
      credentialSubject: {
        id: `${listUrl}#list`,
        type: 'StatusList2021',
        statusPurpose: 'revocation',
        encodedList,
      },
    };
  }
}
