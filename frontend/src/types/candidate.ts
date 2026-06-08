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

/** Sanitized public company profile (GET /recruiter-profiles/by-user/:userId). */
export type RecruiterPublicProfile = {
  id: string;
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
  isVerified: boolean;
  createdAt: string;
};

export type PaginatedJobs = {
  items: JobItem[];
  total: number;
  page: number;
  limit: number;
};

/** Why a candidate matches, via the trust signal (mirrors backend MatchExplanation). */
export type MatchExplanation = {
  matchedVerified: string[];
  matchedClaimedOnly: string[];
  missing: string[];
  contributions: { keyword: number; semantic: number; verified: number };
};

export type ScoreBreakdown = {
  candidateId?: string;
  jobId: string;
  keywordScore: number;
  semanticScore: number;
  verifiedBonus: number;
  totalScore: number;
  explanation?: MatchExplanation;
};

/** Real matching weights (mirror backend matching.service W_*). */
export const MATCH_WEIGHTS = {
  keyword: 0.4,
  semantic: 0.5,
  verified: 0.1,
} as const;

/** A candidate skill (read-only). `isVerified` = backed by an on-chain credential. */
export type CandidateSkill = {
  id: string;
  skillName: string;
  proficiencyLevel?: string | null;
  isVerified: boolean;
  sourceCredentialId?: string | null;
};

/** Aggregates for the candidate dashboard (GET /candidate-profiles/me/dashboard). */
export type CandidateDashboard = {
  credentials: {
    total: number;
    onChain: number;
    byCategory: { category: string; count: number }[];
  };
  applications: {
    total: number;
    byStatus: { status: string; count: number }[];
  };
  profile: {
    completeness: number;
    isOpenToWork: boolean;
  };
};

export type RankedJob = ScoreBreakdown & {
  job: Pick<JobItem, "id" | "title" | "city" | "isRemote" | "salaryMin" | "salaryMax">;
};

/** A credential suggestion to close one skill gap for a target job. */
export type LearningRecommendation = {
  skill: string;
  status: "missing" | "unverified";
  recommendedCredential: { id: string; name: string } | null;
  similarity: number;
};

export type LearningPathResult = {
  jobId: string;
  recommendations: LearningRecommendation[];
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
