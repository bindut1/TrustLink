export type CandidateProfile = {
  id: string;
  userId: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  bio?: string | null;
  resumeUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  yearsOfExperience?: number | null;
  desiredPosition?: string | null;
  desiredSalaryMin?: number | null;
  desiredSalaryMax?: number | null;
  preferredLocations?: string[] | null;
  isOpenToWork?: boolean | null;
  profileCompleteness?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateCandidateProfilePayload = Partial<
  Omit<CandidateProfile, "id" | "userId" | "createdAt" | "updatedAt" | "profileCompleteness">
>;

export type JobItem = {
  id: string;
  recruiterId: string;
  title: string;
  description: string;
  requirements?: string | null;
  benefits?: string | null;
  jobType?: string;
  experienceLevel?: string | null;
  industry?: string | null;
  location?: string | null;
  city?: string | null;
  isRemote: boolean;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryVisible?: boolean;
  requiredSkills: string[];
  preferredSkills?: string[];
  status: string;
  applicationDeadline?: string | null;
  viewCount?: number;
  createdAt: string;
};

export type PaginatedJobs = {
  items: JobItem[];
  total: number;
  page: number;
  limit: number;
};

export type ScoreBreakdown = {
  candidateId?: string;
  jobId: string;
  keywordScore: number;
  semanticScore: number;
  verifiedBonus: number;
  totalScore: number;
};

export type RankedJob = ScoreBreakdown & {
  job: Pick<JobItem, "id" | "title" | "city" | "isRemote" | "salaryMin" | "salaryMax">;
};

export type ApplicationStatus =
  | "applied"
  | "reviewing"
  | "shortlisted"
  | "interview"
  | "offered"
  | "rejected"
  | "withdrawn";

export type ApplicationItem = {
  id: string;
  jobId: string;
  candidateId: string;
  coverLetter?: string | null;
  resumeUrl?: string | null;
  matchScore?: string | number | null;
  keywordScore?: string | number | null;
  semanticScore?: string | number | null;
  verifiedBonus?: string | number | null;
  status: ApplicationStatus;
  statusChangedAt?: string | null;
  recruiterNotes?: string | null;
  credentialsVerified?: boolean;
  createdAt: string;
  job?: Pick<JobItem, "id" | "title" | "city" | "isRemote">;
};
