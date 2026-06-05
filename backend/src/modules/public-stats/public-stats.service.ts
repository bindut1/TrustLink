import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Credential } from '../../database/entities/credential.entity';
import { Institution } from '../../database/entities/institution.entity';
import { User } from '../../database/entities/user.entity';
import { CandidateSkill } from '../../database/entities/candidate-skill.entity';
import { Application } from '../../database/entities/application.entity';
import {
  ApprovalStatus,
  CredentialStatus,
  UserRole,
} from '../../database/enums';

/** Public, non-sensitive platform aggregates shown on the landing page. */
export interface PublicStats {
  credentialsOnChain: number;
  partners: number;
  verifiedSkills: number;
  applications: number;
}

@Injectable()
export class PublicStatsService {
  constructor(
    @InjectRepository(Credential)
    private readonly credentialRepo: Repository<Credential>,
    @InjectRepository(Institution)
    private readonly institutionRepo: Repository<Institution>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(CandidateSkill)
    private readonly skillRepo: Repository<CandidateSkill>,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
  ) {}

  async getStats(): Promise<PublicStats> {
    const [credentialsOnChain, approvedInstitutions, recruiters, verifiedSkills, applications] =
      await Promise.all([
        this.credentialRepo
          .createQueryBuilder('c')
          .where('c.blockchainTxHash IS NOT NULL')
          .andWhere('c.status != :revoked', { revoked: CredentialStatus.REVOKED })
          .getCount(),
        this.institutionRepo.count({
          where: { approvalStatus: ApprovalStatus.APPROVED },
        }),
        this.userRepo.count({ where: { role: UserRole.RECRUITER } }),
        this.skillRepo.count({ where: { isVerified: true } }),
        this.applicationRepo.count(),
      ]);

    return {
      credentialsOnChain,
      // "Partner institutions and employers" = approved issuers + companies.
      partners: approvedInstitutions + recruiters,
      verifiedSkills,
      applications,
    };
  }
}
