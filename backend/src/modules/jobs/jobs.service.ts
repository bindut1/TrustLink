import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../../database/entities/job.entity';
import { JobStatus, NotificationType } from '../../database/enums';
import { EmbeddingService } from '../matching/embedding.service';
import { MatchingService } from '../matching/matching.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SkillsService } from '../skills/skills.service';
import { CreateJobDto } from './dto/create-job.dto';
import { ListJobsQueryDto } from './dto/list-jobs.query.dto';
import { UpdateJobDto } from './dto/update-job.dto';

const ALLOWED_STATUS_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  [JobStatus.DRAFT]: [JobStatus.OPEN],
  [JobStatus.OPEN]: [JobStatus.CLOSED],
  [JobStatus.CLOSED]: [],
  [JobStatus.EXPIRED]: [],
};

export interface PaginatedJobs {
  items: Job[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectRepository(Job)
    private readonly repo: Repository<Job>,
    private readonly embeddings: EmbeddingService,
    private readonly matching: MatchingService,
    private readonly notifications: NotificationsService,
    private readonly skills: SkillsService,
  ) {}

  private async resolveSkillsOrThrow(
    skills: string[] | undefined,
    label: string,
  ): Promise<string[]> {
    const { tokens, unknown } = await this.skills.resolve(skills);
    if (unknown.length > 0) {
      throw new BadRequestException(
        `${label}: unknown skills not in catalog: ${unknown.join(', ')}`,
      );
    }
    return tokens;
  }

  async create(recruiterId: string, dto: CreateJobDto): Promise<Job> {
    if (
      dto.salaryMin != null &&
      dto.salaryMax != null &&
      dto.salaryMin > dto.salaryMax
    ) {
      throw new BadRequestException('salaryMin must be <= salaryMax');
    }

    const requiredSkills = await this.resolveSkillsOrThrow(
      dto.requiredSkills,
      'requiredSkills',
    );
    const preferredSkills = await this.resolveSkillsOrThrow(
      dto.preferredSkills,
      'preferredSkills',
    );

    const job = this.repo.create({
      recruiterId,
      title: dto.title,
      description: dto.description,
      requirements: dto.requirements ?? null,
      benefits: dto.benefits ?? null,
      jobType: dto.jobType ?? 'full_time',
      experienceLevel: dto.experienceLevel ?? null,
      industry: dto.industry ?? null,
      location: dto.location ?? null,
      city: dto.city ?? null,
      isRemote: dto.isRemote ?? false,
      salaryMin: dto.salaryMin ?? null,
      salaryMax: dto.salaryMax ?? null,
      salaryVisible: dto.salaryVisible ?? true,
      requiredSkills,
      preferredSkills,
      requiredCredentialTypes: dto.requiredCredentialTypes ?? [],
      applicationDeadline: dto.applicationDeadline
        ? new Date(dto.applicationDeadline)
        : null,
      maxApplications: dto.maxApplications ?? null,
      status: JobStatus.DRAFT,
    });
    const saved = await this.repo.save(job);
    await this.refreshEmbedding(saved.id);
    return saved;
  }

  async findAll(query: ListJobsQueryDto): Promise<PaginatedJobs> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const status =
      query.status ?? (query.recruiterId ? undefined : JobStatus.OPEN);

    const qb = this.repo.createQueryBuilder('job');

    if (status) {
      qb.where('job.status = :status', { status });
    } else {
      qb.where('1=1');
    }

    if (query.recruiterId) {
      qb.andWhere('job.recruiter_id = :recruiterId', {
        recruiterId: query.recruiterId,
      });
    }

    if (query.city) {
      qb.andWhere('job.city = :city', { city: query.city });
    }
    if (query.jobType) {
      qb.andWhere('job.job_type = :jobType', { jobType: query.jobType });
    }
    if (query.isRemote !== undefined) {
      qb.andWhere('job.is_remote = :isRemote', { isRemote: query.isRemote });
    }
    if (query.salaryMin != null) {
      qb.andWhere(
        '(job.salary_max IS NULL OR job.salary_max >= :salaryMinFloor)',
        { salaryMinFloor: query.salaryMin },
      );
    }
    if (query.salaryMax != null) {
      qb.andWhere(
        '(job.salary_min IS NULL OR job.salary_min <= :salaryMaxCeiling)',
        { salaryMaxCeiling: query.salaryMax },
      );
    }
    if (query.search) {
      qb.andWhere(
        '(job.title ILIKE :search OR job.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }
    qb.orderBy('job.created_at', 'DESC');

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findById(id: string): Promise<Job> {
    const job = await this.repo.findOne({
      where: { id },
      relations: ['recruiter'],
    });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.repo.increment({ id }, 'viewCount', 1);
  }

  async update(
    id: string,
    recruiterId: string,
    dto: UpdateJobDto,
  ): Promise<Job> {
    const job = await this.repo.findOne({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.recruiterId !== recruiterId) {
      throw new ForbiddenException('Not the owner of this job');
    }

    if (dto.status && dto.status !== job.status) {
      const allowed = ALLOWED_STATUS_TRANSITIONS[job.status] ?? [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot transition from ${job.status} to ${dto.status}`,
        );
      }
      job.status = dto.status;
    }

    const { status: _status, ...fields } = dto;
    void _status;
    Object.assign(job, fields);

    if (dto.requiredSkills !== undefined) {
      job.requiredSkills = await this.resolveSkillsOrThrow(
        dto.requiredSkills,
        'requiredSkills',
      );
    }
    if (dto.preferredSkills !== undefined) {
      job.preferredSkills = await this.resolveSkillsOrThrow(
        dto.preferredSkills,
        'preferredSkills',
      );
    }

    if (
      job.salaryMin != null &&
      job.salaryMax != null &&
      job.salaryMin > job.salaryMax
    ) {
      throw new BadRequestException('salaryMin must be <= salaryMax');
    }

    const wasPublished =
      dto.status === JobStatus.OPEN && job.status === JobStatus.DRAFT;

    const saved = await this.repo.save(job);
    await this.refreshEmbedding(saved.id);

    if (wasPublished) {
      this.notifyTopCandidates(saved).catch((err) =>
        this.logger.warn(
          `Job recommendation notifications failed for ${saved.id}: ${(err as Error).message}`,
        ),
      );
    }

    return saved;
  }

  private async notifyTopCandidates(job: Job): Promise<void> {
    const ranked = await this.matching.recommendCandidatesForJob(job.id, 10);
    if (ranked.length === 0) return;
    const userIds = ranked.map((r) => r.candidate.id);
    await this.notifications.broadcast(
      {
        type: NotificationType.JOB_RECOMMENDATION,
        title: 'Gợi ý việc làm mới',
        message: `Có một tin tuyển dụng phù hợp với hồ sơ của bạn: "${job.title}".`,
        referenceType: 'job',
        referenceId: job.id,
      },
      userIds,
    );
  }

  private async refreshEmbedding(jobId: string): Promise<void> {
    try {
      await this.embeddings.updateJobEmbedding(jobId);
    } catch (err) {
      this.logger.warn(
        `Failed to refresh embedding for job ${jobId}: ${(err as Error).message}`,
      );
    }
  }
}
