import type { LucideIcon } from "lucide-react";
import {
  Award,
  Briefcase,
  Building2,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Link2,
  ScrollText,
  Search,
  ShieldCheck,
  UserCircle,
  Users,
  Wallet,
} from "lucide-react";
import type { UserRole } from "@/types/auth";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type NavSection = {
  /** Optional eyebrow header above a group of items. */
  label?: string;
  items: NavItem[];
};

const ADMIN_NAV: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Manage",
    items: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Institutions", href: "/admin/institutions", icon: Building2 },
      { label: "Credential types", href: "/admin/credential-types", icon: FileText },
    ],
  },
  {
    label: "Monitor",
    items: [
      { label: "Blockchain", href: "/admin/blockchain", icon: Link2 },
      { label: "Audit logs", href: "/admin/audit-logs", icon: ScrollText },
    ],
  },
];

const ISSUER_NAV: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/issuer/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Credentials",
    items: [
      { label: "All credentials", href: "/issuer/credentials", icon: Award },
      { label: "Issue new", href: "/issuer/issue", icon: ShieldCheck },
      { label: "Batch import", href: "/issuer/batch", icon: ClipboardList },
    ],
  },
  {
    items: [{ label: "Institution profile", href: "/issuer/profile", icon: Building2 }],
  },
];

const CANDIDATE_NAV: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/candidate/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "My career",
    items: [
      { label: "Credentials", href: "/candidate/credentials", icon: Wallet },
      { label: "Applications", href: "/candidate/applications", icon: ClipboardList },
      { label: "Find jobs", href: "/candidate/jobs", icon: Search },
    ],
  },
  {
    items: [{ label: "Profile", href: "/candidate/profile", icon: UserCircle }],
  },
];

const RECRUITER_NAV: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/recruiter/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Hiring",
    items: [
      { label: "Jobs", href: "/recruiter/jobs", icon: Briefcase },
      { label: "Candidates", href: "/recruiter/candidates", icon: GraduationCap },
      { label: "Applications", href: "/recruiter/applications", icon: ClipboardList },
    ],
  },
  {
    items: [{ label: "Company profile", href: "/recruiter/profile", icon: Building2 }],
  },
];

export const NAV_BY_ROLE: Record<UserRole, NavSection[]> = {
  admin: ADMIN_NAV,
  issuer: ISSUER_NAV,
  candidate: CANDIDATE_NAV,
  recruiter: RECRUITER_NAV,
};

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin Console",
  issuer: "Issuer Portal",
  candidate: "Candidate Workspace",
  recruiter: "Recruiter Hub",
};
