/**
 * Recruiter-side types. Named `recruiter-app` to avoid colliding with the
 * earlier `recruiter.ts` mock from the design-reference port.
 */

import type {
  ApplicationItem,
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
};
