import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Application } from '../../database/entities/application.entity';
import { Job } from '../../database/entities/job.entity';
import { User } from '../../database/entities/user.entity';
import {
  ApplicationStatus,
  JobStatus,
  NotificationType,
  UserRole,
} from '../../database/enums';
import { MatchingService } from '../matching/matching.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

const VI_STATUS: Record<string, string> = {
  applied: 'Đã ứng tuyển',
  reviewing: 'Đang xem xét',
  shortlisted: 'Vào vòng tiếp theo',
  interview: 'Phỏng vấn',
  offered: 'Đã có offer',
  rejected: 'Bị từ chối',
  withdrawn: 'Đã rút đơn',
};

const ALLOWED_STATUS_TRANSITIONS: Record<
  ApplicationStatus,
  ApplicationStatus[]
> = {
  [ApplicationStatus.APPLIED]: [
    ApplicationStatus.REVIEWING,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.REVIEWING]: [
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.SHORTLISTED]: [
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.INTERVIEW]: [
    ApplicationStatus.OFFERED,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.OFFERED]: [ApplicationStatus.REJECTED],
  [ApplicationStatus.REJECTED]: [],
  [ApplicationStatus.WITHDRAWN]: [],
};

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    @InjectRepository(Application)
    private readonly repo: Repository<Application>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    private readonly notifications: NotificationsService,
    private readonly matching: MatchingService,
  ) {}

  async create(
    candidate: User,
    dto: CreateApplicationDto,
  ): Promise<Application> {
    if (candidate.role !== UserRole.CANDIDATE) {
      throw new ForbiddenException('Only candidates can apply to jobs');
    }

    const job = await this.jobRepo.findOne({ where: { id: dto.jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestException('Job is not open for applications');
    }

    // Snapshot the match score at apply time. Failures (e.g. AI service
    // unreachable, embeddings not yet built) leave the score columns null —
    // the application still goes through, and recruiters see it sorted
    // NULLS LAST in `findForJob`.
    let scoreSnapshot: {
      matchScore: string;
      keywordScore: string;
      semanticScore: string;
      verifiedBonus: string;
      breakdown: Record<string, unknown>;
    } | null = null;
    try {
      const score = await this.matching.calculateScore(candidate.id, job.id);
      scoreSnapshot = {
        matchScore: score.totalScore.toFixed(2),
        keywordScore: score.keywordScore.toFixed(2),
        semanticScore: score.semanticScore.toFixed(2),
        verifiedBonus: score.verifiedBonus.toFixed(2),
        breakdown: {
          totalScore: score.totalScore,
          keywordScore: score.keywordScore,
          semanticScore: score.semanticScore,
          verifiedBonus: score.verifiedBonus,
          weights: { keyword: 0.4, semantic: 0.5, verified: 0.1 },
          computedAt: new Date().toISOString(),
        },
      };
    } catch (err) {
      this.logger.warn(
        `Match score snapshot failed for candidate=${candidate.id} job=${job.id}: ${(err as Error).message}`,
      );
    }

    const application = this.repo.create({
      jobId: job.id,
      candidateId: candidate.id,
      coverLetter: dto.coverLetter ?? null,
      resumeUrl: dto.resumeUrl ?? null,
      status: ApplicationStatus.APPLIED,
      statusChangedAt: new Date(),
      matchScore: scoreSnapshot?.matchScore ?? null,
      keywordScore: scoreSnapshot?.keywordScore ?? null,
      semanticScore: scoreSnapshot?.semanticScore ?? null,
      verifiedBonus: scoreSnapshot?.verifiedBonus ?? null,
      scoreBreakdown: scoreSnapshot?.breakdown ?? {},
    });

    let saved: Application;
    try {
      saved = await this.repo.save(application);
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err as QueryFailedError & { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Already applied to this job');
      }
      throw err;
    }

    await this.notifications.create({
      userId: job.recruiterId,
      type: NotificationType.APPLICATION_RECEIVED,
      title: 'Đơn ứng tuyển mới',
      message: `${candidate.fullName} đã ứng tuyển vào vị trí "${job.title}".`,
      referenceType: 'application',
      referenceId: saved.id,
    });

    return saved;
  }

  async findMy(candidateId: string): Promise<Application[]> {
    return this.repo.find({
      where: { candidateId },
      relations: ['job'],
      order: { createdAt: 'DESC' },
    });
  }

  async findForJob(jobId: string, recruiterId: string): Promise<Application[]> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.recruiterId !== recruiterId) {
      throw new ForbiddenException('Not the owner of this job');
    }

    // Sort by match_score DESC; NULLS LAST so unscored applications sink.
    return this.repo
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.candidate', 'candidate')
      .leftJoinAndSelect('candidate.candidateProfile', 'candidateProfile')
      .where('application.job_id = :jobId', { jobId })
      .orderBy('application.match_score', 'DESC', 'NULLS LAST')
      .addOrderBy('application.created_at', 'DESC')
      .getMany();
  }

  async updateStatus(
    id: string,
    recruiterId: string,
    dto: UpdateApplicationStatusDto,
  ): Promise<Application> {
    const application = await this.repo.findOne({
      where: { id },
      relations: ['job'],
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.job.recruiterId !== recruiterId) {
      throw new ForbiddenException('Not the owner of this job / application');
    }

    if (dto.status !== application.status) {
      const allowed = ALLOWED_STATUS_TRANSITIONS[application.status] ?? [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot transition from ${application.status} to ${dto.status}`,
        );
      }
      application.status = dto.status;
      application.statusChangedAt = new Date();
    }

    if (dto.recruiterNotes !== undefined) {
      application.recruiterNotes = dto.recruiterNotes;
    }

    const saved = await this.repo.save(application);

    await this.notifications.create({
      userId: saved.candidateId,
      type: NotificationType.APPLICATION_STATUS_CHANGED,
      title: 'Trạng thái đơn ứng tuyển thay đổi',
      message: `Đơn ứng tuyển của bạn cho vị trí "${application.job.title}" đã chuyển sang: ${VI_STATUS[saved.status] ?? saved.status}.`,
      referenceType: 'application',
      referenceId: saved.id,
    });

    return saved;
  }
}
