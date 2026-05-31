import { Briefcase, Building2, GraduationCap, type LucideIcon } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { UserRole } from "@/types/auth";

export type RegisterRole = Exclude<UserRole, "admin">;

export type RoleOption = {
  key: RegisterRole;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: LucideIcon;
};

export const REGISTER_ROLES: RoleOption[] = [
  {
    key: "candidate",
    titleKey: "roleSelect.candidate",
    descriptionKey: "roleSelect.candidateDesc",
    icon: GraduationCap,
  },
  {
    key: "recruiter",
    titleKey: "roleSelect.recruiter",
    descriptionKey: "roleSelect.recruiterDesc",
    icon: Briefcase,
  },
  {
    key: "issuer",
    titleKey: "roleSelect.issuer",
    descriptionKey: "roleSelect.issuerDesc",
    icon: Building2,
  },
];

export const INSTITUTION_TYPES: { value: string; labelKey: TranslationKey }[] = [
  { value: "university", labelKey: "institutionType.university" },
  { value: "college", labelKey: "institutionType.college" },
  { value: "training_provider", labelKey: "institutionType.training_center" },
  { value: "professional_body", labelKey: "institutionType.professional_body" },
  { value: "other", labelKey: "institutionType.other" },
];

export const COMPANY_SIZES: { value: string; labelKey: TranslationKey }[] = [
  { value: "1-10", labelKey: "companySize.1_10" }, // gitleaks:allow
  { value: "11-50", labelKey: "companySize.11_50" }, // gitleaks:allow
  { value: "51-200", labelKey: "companySize.51_200" }, // gitleaks:allow
  { value: "201-1000", labelKey: "companySize.201_1000" }, // gitleaks:allow
  { value: "1000+", labelKey: "companySize.1000_plus" }, // gitleaks:allow
];
