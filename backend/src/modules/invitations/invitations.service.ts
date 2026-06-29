import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Application } from '../../database/entities/application.entity';
import { Job } from '../../database/entities/job.entity';
import { JobInvitation } from '../../database/entities/job-invitation.entity';
import { User } from '../../database/entities/user.entity';
import {
  JobInvitationStatus,
  JobStatus,
  NotificationType,
  UserRole,
} from '../../database/enums';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(JobInvitation)
    private readonly repo: Repository<JobInvitation>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    private readonly notifications: NotificationsService,
  ) {}

  async invite(
    jobId: string,
    candidateId: string,
    recruiter: User,
    dto: CreateInvitationDto,
  ): Promise<JobInvitation> {
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
      relations: ['recruiter', 'recruiter.recruiterProfile'],
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.recruiterId !== recruiter.id) {
      throw new ForbiddenException('Not the owner of this job');
    }
    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestException(
        'Only open jobs can be offered to candidates',
      );
    }

    const candidate = await this.userRepo.findOne({
      where: { id: candidateId },
      relations: ['candidateProfile'],
    });
    if (!candidate || candidate.role !== UserRole.CANDIDATE) {
      throw new NotFoundException('Candidate not found');
    }
    if (candidate.candidateProfile?.isOpenToWork === false) {
      throw new ForbiddenException('Candidate has hidden their profile');
    }

    const existingApplication = await this.applicationRepo.findOne({
      where: { jobId, candidateId },
    });
    if (existingApplication) {
      throw new ConflictException('Candidate has already applied to this job');
    }

    const existingInvite = await this.repo.findOne({
      where: { jobId, candidateId },
    });
    if (existingInvite) {
      throw new ConflictException('Candidate has already been invited');
    }

    const message = dto.message?.trim() || null;
    const invitation = this.repo.create({
      jobId,
      candidateId,
      recruiterId: recruiter.id,
      message,
      status: JobInvitationStatus.PENDING,
    });
    const saved = await this.repo.save(invitation);

    const companyName =
      job.recruiter?.recruiterProfile?.companyName ?? recruiter.fullName;
    const defaultMsg = `${companyName} mời bạn ứng tuyển vào vị trí "${job.title}". Xem chi tiết và nộp hồ sơ nếu bạn quan tâm nhé.`;

    await this.notifications.create({
      userId: candidateId,
      type: NotificationType.JOB_RECOMMENDATION,
      title: 'Lời mời ứng tuyển',
      message: message ? `${companyName}: ${message}` : defaultMsg,
      referenceType: 'invitation',
      referenceId: saved.id,
    });

    return saved;
  }

  async findMyInvitations(candidateId: string): Promise<
    Array<{
      id: string;
      message: string | null;
      status: JobInvitationStatus;
      declineReason: string | null;
      hasApplied: boolean;
      createdAt: Date;
      recruiterId: string;
      recruiterName: string;
      job: Job;
    }>
  > {
    const invitations = await this.repo.find({
      where: { candidateId },
      relations: ['job', 'recruiter', 'recruiter.recruiterProfile'],
      order: { createdAt: 'DESC' },
    });
    if (invitations.length === 0) return [];

    const jobIds = invitations.map((i) => i.jobId);
    const applications = await this.applicationRepo.find({
      where: { candidateId, jobId: In(jobIds) },
      select: ['jobId'],
    });
    const appliedJobIds = new Set(applications.map((a) => a.jobId));

    return invitations.map((inv) => ({
      id: inv.id,
      message: inv.message,
      status: inv.status,
      declineReason: inv.declineReason,
      hasApplied: appliedJobIds.has(inv.jobId),
      createdAt: inv.createdAt,
      recruiterId: inv.recruiterId,
      recruiterName:
        inv.recruiter?.recruiterProfile?.companyName ??
        inv.recruiter?.fullName ??
        '',
      job: inv.job,
    }));
  }

  async findForJob(
    jobId: string,
    recruiterId: string,
  ): Promise<
    Array<{
      id: string;
      message: string | null;
      status: JobInvitationStatus;
      declineReason: string | null;
      hasApplied: boolean;
      createdAt: Date;
      candidate: {
        id: string;
        fullName: string;
        email: string;
        phone: string | null;
        avatarUrl: string | null;
        candidateProfile: unknown;
      };
    }>
  > {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.recruiterId !== recruiterId) {
      throw new ForbiddenException('Not the owner of this job');
    }

    const invitations = await this.repo.find({
      where: { jobId },
      relations: ['candidate', 'candidate.candidateProfile'],
      order: { createdAt: 'DESC' },
    });
    if (invitations.length === 0) return [];

    const candidateIds = invitations.map((i) => i.candidateId);
    const applications = await this.applicationRepo.find({
      where: { jobId, candidateId: In(candidateIds) },
      select: ['candidateId'],
    });
    const appliedCandidateIds = new Set(applications.map((a) => a.candidateId));

    return invitations.map((inv) => ({
      id: inv.id,
      message: inv.message,
      status: inv.status,
      declineReason: inv.declineReason,
      hasApplied: appliedCandidateIds.has(inv.candidateId),
      createdAt: inv.createdAt,
      candidate: {
        id: inv.candidate.id,
        fullName: inv.candidate.fullName,
        email: inv.candidate.email,
        phone: inv.candidate.phone,
        avatarUrl: inv.candidate.avatarUrl,
        candidateProfile: inv.candidate.candidateProfile ?? null,
      },
    }));
  }

  async decline(
    id: string,
    candidateId: string,
    reason?: string,
  ): Promise<JobInvitation> {
    const invitation = await this.repo.findOne({
      where: { id },
      relations: ['job', 'candidate'],
    });
    if (!invitation || invitation.candidateId !== candidateId) {
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.status === JobInvitationStatus.DECLINED) return invitation;

    const trimmed = reason?.trim() || null;
    invitation.status = JobInvitationStatus.DECLINED;
    invitation.declineReason = trimmed;
    await this.repo.save(invitation);

    const base = `${invitation.candidate.fullName} đã từ chối lời mời ứng tuyển vị trí "${invitation.job.title}".`;
    await this.notifications.create({
      userId: invitation.recruiterId,
      type: NotificationType.APPLICATION_STATUS_CHANGED,
      title: 'Lời mời bị từ chối',
      message: trimmed ? `${base} Lý do: ${trimmed}` : base,
      referenceType: 'invitation',
      referenceId: invitation.id,
    });

    return invitation;
  }
}
