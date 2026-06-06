import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecruiterProfile } from '../../database/entities/recruiter-profile.entity';
import { Job } from '../../database/entities/job.entity';
import { Application } from '../../database/entities/application.entity';
import { JobStatus } from '../../database/enums';
import { UpdateRecruiterProfileDto } from './dto/update-recruiter-profile.dto';

/** Aggregates powering the recruiter dashboard. */
export interface RecruiterDashboard {
  jobs: { total: number; open: number; draft: number; closed: number };
  applicants: { total: number; byStatus: { status: string; count: number }[] };
  applicationsByMonth: { month: string; count: number }[];
  recent: {
    id: string;
    candidateName: string | null;
    candidateAvatarUrl: string | null;
    jobTitle: string | null;
    status: string;
    matchScore: number | null;
    createdAt: string;
  }[];
  profile: { companyName: string; isVerified: boolean };
}

@Injectable()
export class RecruiterProfilesService {
  constructor(
    @InjectRepository(RecruiterProfile)
    private readonly repo: Repository<RecruiterProfile>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,
  ) {}

  /**
   * Dashboard aggregates for the current recruiter — jobs by status, applicant
   * counts/funnel, a per-month application time-series, and recent applicants.
   * All scoped to jobs owned by this recruiter (real DB aggregations).
   */
  async getDashboard(userId: string): Promise<RecruiterDashboard> {
    const profile = await this.findByUserId(userId).catch(() => null);

    const [jobStatusRows, appTotal, appStatusRows, monthRows, recent] =
      await Promise.all([
        this.jobRepo
          .createQueryBuilder('j')
          .select('j.status', 'status')
          .addSelect('COUNT(*)', 'count')
          .where('j.recruiterId = :userId', { userId })
          .groupBy('j.status')
          .getRawMany<{ status: string; count: string }>(),
        this.appRepo
          .createQueryBuilder('a')
          .innerJoin('a.job', 'j')
          .where('j.recruiterId = :userId', { userId })
          .getCount(),
        this.appRepo
          .createQueryBuilder('a')
          .innerJoin('a.job', 'j')
          .select('a.status', 'status')
          .addSelect('COUNT(*)', 'count')
          .where('j.recruiterId = :userId', { userId })
          .groupBy('a.status')
          .getRawMany<{ status: string; count: string }>(),
        this.appRepo
          .createQueryBuilder('a')
          .innerJoin('a.job', 'j')
          .select("TO_CHAR(DATE_TRUNC('month', a.created_at), 'YYYY-MM')", 'month')
          .addSelect('COUNT(*)', 'count')
          .where('j.recruiterId = :userId', { userId })
          .groupBy("DATE_TRUNC('month', a.created_at)")
          .orderBy("DATE_TRUNC('month', a.created_at)", 'ASC')
          .getRawMany<{ month: string; count: string }>(),
        this.appRepo
          .createQueryBuilder('a')
          .innerJoin('a.job', 'j')
          .addSelect(['j.title'])
          .leftJoin('a.candidate', 'cand')
          .addSelect(['cand.fullName', 'cand.avatarUrl'])
          .where('j.recruiterId = :userId', { userId })
          .orderBy('a.createdAt', 'DESC')
          .take(6)
          .getMany(),
      ]);

    const jobStatus = new Map(
      jobStatusRows.map((r) => [r.status, Number(r.count)]),
    );
    const jobTotal = jobStatusRows.reduce((s, r) => s + Number(r.count), 0);

    return {
      jobs: {
        total: jobTotal,
        open: jobStatus.get(JobStatus.OPEN) ?? 0,
        draft: jobStatus.get(JobStatus.DRAFT) ?? 0,
        closed: jobStatus.get(JobStatus.CLOSED) ?? 0,
      },
      applicants: {
        total: appTotal,
        byStatus: appStatusRows.map((r) => ({
          status: r.status,
          count: Number(r.count),
        })),
      },
      applicationsByMonth: monthRows.map((r) => ({
        month: r.month,
        count: Number(r.count),
      })),
      recent: recent.map((a) => ({
        id: a.id,
        candidateName: a.candidate?.fullName ?? null,
        candidateAvatarUrl: a.candidate?.avatarUrl ?? null,
        jobTitle: a.job?.title ?? null,
        status: a.status,
        matchScore: a.matchScore != null ? Number(a.matchScore) : null,
        createdAt: a.createdAt.toISOString(),
      })),
      profile: {
        companyName: profile?.companyName ?? '',
        isVerified: profile?.isVerified ?? false,
      },
    };
  }

  async findById(id: string): Promise<RecruiterProfile> {
    const profile = await this.repo
      .createQueryBuilder('p')
      .leftJoin('p.user', 'u')
      .addSelect(['u.id', 'u.email', 'u.fullName', 'u.avatarUrl'])
      .where('p.id = :id', { id })
      .getOne();
    if (!profile) throw new NotFoundException('Recruiter profile not found');
    return profile;
  }

  async findByUserId(userId: string): Promise<RecruiterProfile> {
    const profile = await this.repo
      .createQueryBuilder('p')
      .leftJoin('p.user', 'u')
      .addSelect(['u.id', 'u.email', 'u.fullName', 'u.avatarUrl'])
      .where('p.userId = :userId', { userId })
      .getOne();
    if (!profile) throw new NotFoundException('Recruiter profile not found');
    return profile;
  }

  /**
   * Sanitized public company profile for a recruiter, looked up by their
   * user id (= Job.recruiterId). Excludes sensitive fields (tax code, contact
   * email) so any authenticated user — e.g. a candidate browsing jobs — can
   * view the hiring company.
   */
  async findPublicByUserId(userId: string) {
    const p = await this.findByUserId(userId);
    return {
      id: p.id,
      companyName: p.companyName,
      companyNameEn: p.companyNameEn,
      companyLogoUrl: p.companyLogoUrl,
      industry: p.industry,
      companySize: p.companySize,
      companyWebsite: p.companyWebsite,
      companyAddress: p.companyAddress,
      city: p.city,
      country: p.country,
      description: p.description,
      isVerified: p.isVerified,
      createdAt: p.createdAt,
    };
  }

  async updateByUserId(
    userId: string,
    dto: UpdateRecruiterProfileDto,
  ): Promise<RecruiterProfile> {
    const profile = await this.findByUserId(userId);
    Object.assign(profile, dto);
    return this.repo.save(profile);
  }
}
