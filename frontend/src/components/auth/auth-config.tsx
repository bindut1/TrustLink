import { Briefcase, Building2, GraduationCap, type LucideIcon } from "lucide-react";
import type { UserRole } from "@/types/auth";

export type RegisterRole = Exclude<UserRole, "admin">;

export type RoleOption = {
  key: RegisterRole;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const REGISTER_ROLES: RoleOption[] = [
  {
    key: "candidate",
    title: "Candidate",
    description: "Showcase verified credentials and apply to jobs.",
    icon: GraduationCap,
  },
  {
    key: "recruiter",
    title: "Recruiter",
    description: "Post jobs and find candidates with on-chain credentials.",
    icon: Briefcase,
  },
  {
    key: "issuer",
    title: "Issuing Institution",
    description: "Issue verifiable credentials to your members and graduates.",
    icon: Building2,
  },
];

export const INSTITUTION_TYPES = [
  { value: "university", label: "University" },
  { value: "college", label: "College / vocational school" },
  { value: "training_provider", label: "Training provider" },
  { value: "professional_body", label: "Professional body" },
  { value: "other", label: "Other" },
];

export const COMPANY_SIZES = [
  { value: "1-10", label: "1–10 employees" },
  { value: "11-50", label: "11–50 employees" },
  { value: "51-200", label: "51–200 employees" },
  { value: "201-1000", label: "201–1,000 employees" },
  { value: "1000+", label: "1,000+ employees" },
];
