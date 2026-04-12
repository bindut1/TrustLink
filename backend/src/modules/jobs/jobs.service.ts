import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../../database/entities/job.entity';
import { JobStatus } from '../../database/enums';
import { CreateJobDto } from './dto/create-job.dto';
import { ListJobsQueryDto } from './dto/list-jobs.query.dto';
import { UpdateJobDto } from './dto/update-job.dto';

// Allowed status transitions for recruiter updates.
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
  constructor(
    @InjectRepository(Job)
    private readonly repo: Repository<Job>,
  ) {}

  async create(recruiterId: string, dto: CreateJobDto): Promise<Job> {
    if (
      dto.salaryMin != null &&
      dto.salaryMax != null &&
      dto.salaryMin > dto.salaryMax
    ) {
      throw new BadRequestException('salaryMin must be <= salaryMax');
    }

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
      requiredSkills: dto.requiredSkills ?? [],
      preferredSkills: dto.preferredSkills ?? [],
      requiredCredentialTypes: dto.requiredCredentialTypes ?? [],
      applicationDeadline: dto.applicationDeadline
        ? new Date(dto.applicationDeadline)
        : null,
      maxApplications: dto.maxApplications ?? null,
      status: JobStatus.DRAFT,
    });
    return this.repo.save(job);
  }

  async findAll(query: ListJobsQueryDto): Promise<PaginatedJobs> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const status = query.status ?? JobStatus.OPEN;

    const qb = this.repo
      .createQueryBuilder('job')
      .where('job.status = :status', { status });

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
      // Job's max salary must meet or exceed the candidate's floor.
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
      // pg_trgm similarity operator (%) uses the GIN trigram index on title.
      qb.andWhere('job.title % :search', { search: query.search });
      qb.orderBy('similarity(job.title, :search)', 'DESC');
      qb.addOrderBy('job.created_at', 'DESC');
    } else {
      qb.orderBy('job.created_at', 'DESC');
    }

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

    if (
      job.salaryMin != null &&
      job.salaryMax != null &&
      job.salaryMin > job.salaryMax
    ) {
      throw new BadRequestException('salaryMin must be <= salaryMax');
    }

    return this.repo.save(job);
  }
}
