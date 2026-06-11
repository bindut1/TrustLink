/**
 * Recruiter-side types. Named `recruiter-app` to avoid colliding with the
 * earlier `recruiter.ts` mock from the design-reference port.
 */

import type {
  ApplicationItem,
  ApplicationStatus,
  JobItem,
  ScoreBreakdown,
} from "./candidate";

export type RecruiterProfile = {
  id: string;
  userId: string;
  companyName: string;
  companyNameEn?: string | null;
  companyLogoUrl?: string | null;
  industry?: string | null;
  companySize?: string | null;
  companyWebsite?: string | null;
  companyAddress?: string | null;
  city?: string | null;
  country?: string | null;
  description?: string | null;
  taxCode?: string | null;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpdateRecruiterProfilePayload = Partial<
  Omit<RecruiterProfile, "id" | "userId" | "createdAt" | "updatedAt">
>;

export type JobStatus = "draft" | "open" | "closed" | "expired";

export type RecruiterJob = JobItem & {
  status: JobStatus;
};

/** Aggregates for the recruiter dashboard (GET /recruiter-profiles/me/dashboard). */
export type RecruiterDashboard = {
  jobs: { total: number; open: number; draft: number; closed: number };
  applicants: { total: number; byStatus: { status: string; count: number }[] };
  applicationsByMonth: { month: string; count: number }[];
  recent: {
    id: string;
    candidateName: string | null;
    candidateAvatarUrl: string | null;
    jobTitle: string | null;
    status: ApplicationStatus;
    matchScore: number | null;
    createdAt: string;
  }[];
  profile: { companyName: string; isVerified: boolean };
};

export type CreateJobPayload = {
  title: string;
  description: string;
  requirements?: string;
  benefits?: string;
  jobType?: string;
  experienceLevel?: string;
  industry?: string;
  location?: string;
  city?: string;
  isRemote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  salaryVisible?: boolean;
  requiredSkills?: string[];
  preferredSkills?: string[];
  applicationDeadline?: string;
  maxApplications?: number;
};

export type RankedCandidate = ScoreBreakdown & {
  candidate: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
    candidateProfile?: CandidateProfile | null;
  };
};

export type CandidateProfile = {
  bio?: string | null;
  desiredPosition?: string | null;
  yearsOfExperience?: number;
  isOpenToWork?: boolean;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  resumeUrl?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  desiredSalaryMin?: number | null;
  desiredSalaryMax?: number | null;
  preferredLocations?: string[] | null;
};

export type ApplicationWithCandidate = ApplicationItem & {
  candidate?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
    candidateProfile?: CandidateProfile | null;
  };
  /**
   * True when the candidate turned off "open to work": the backend strips
   * contact info / profile / resume and the UI explains why instead of
   * rendering empty sections.
   */
  profileHidden?: boolean;
};

/** An invitation a recruiter sent for a job (recruiter-side "Lời mời" tab). */
export type SentInvitationItem = {
  id: string;
  message: string | null;
  status: "pending" | "declined";
  declineReason: string | null;
  hasApplied: boolean;
  createdAt: string;
  candidate: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
    candidateProfile?: CandidateProfile | null;
  };
};
