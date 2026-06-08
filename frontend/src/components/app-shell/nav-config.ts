import type { LucideIcon } from "lucide-react";
import {
  Award,
  Briefcase,
  Building2,
  ClipboardList,
  FileText,
  KeyRound,
  LayoutDashboard,
  Link2,
  ScrollText,
  Search,
  Sparkles,
  Tags,
  UserCircle,
  Users,
  Wallet,
} from "lucide-react";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { UserRole } from "@/types/auth";

/**
 * A leaf nav item with a direct route.
 */
export type NavLeaf = {
  labelKey: TranslationKey;
  href: string;
  icon: LucideIcon;
};

/**
 * A collapsible group of nav items. When present in the sidebar, clicking the
 * parent toggles the expansion; it does not navigate. `children` items are
 * rendered slightly indented below.
 */
export type NavGroup = {
  labelKey: TranslationKey;
  icon: LucideIcon;
  children: NavLeaf[];
};

export type NavItem = NavLeaf | NavGroup;

export function isNavGroup(item: NavItem): item is NavGroup {
  return "children" in item;
}

export type NavSection = {
  labelKey?: TranslationKey;
  items: NavItem[];
};

// Settings section — bundles Profile + Change password under a static section
// header (rendered like "Văn bằng"), not a collapsible dropdown. Language
// preference lives in the topbar toggle.
function settingsSection(role: UserRole, profileIcon: LucideIcon): NavSection {
  return {
    labelKey: "settings.title",
    items: [
      { labelKey: "nav.profile", href: `/${role}/profile`, icon: profileIcon },
      {
        labelKey: "settings.password",
        href: `/${role}/settings/password`,
        icon: KeyRound,
      },
    ],
  };
}

const ADMIN_NAV: NavSection[] = [
  {
    items: [
      { labelKey: "nav.dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    labelKey: "navSection.manage",
    items: [
      { labelKey: "nav.users", href: "/admin/users", icon: Users },
      { labelKey: "nav.institutions", href: "/admin/institutions", icon: Building2 },
      { labelKey: "nav.credentialTypes", href: "/admin/credential-types", icon: FileText },
      { labelKey: "nav.skills", href: "/admin/skills", icon: Tags },
    ],
  },
  {
    labelKey: "navSection.monitor",
    items: [
      { labelKey: "nav.blockchain", href: "/admin/blockchain", icon: Link2 },
      { labelKey: "nav.auditLogs", href: "/admin/audit-logs", icon: ScrollText },
    ],
  },
];

const ISSUER_NAV: NavSection[] = [
  {
    items: [
      { labelKey: "nav.dashboard", href: "/issuer/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    labelKey: "navSection.credentials",
    items: [
      { labelKey: "nav.allCredentials", href: "/issuer/credentials", icon: Award },
      { labelKey: "nav.issueOnchain", href: "/issuer/issue-onchain", icon: Link2 },
      { labelKey: "nav.issueBulk", href: "/issuer/issue-bulk", icon: ClipboardList },
    ],
  },
  settingsSection("issuer", Building2),
];

const CANDIDATE_NAV: NavSection[] = [
  {
    items: [
      { labelKey: "nav.dashboard", href: "/candidate/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    labelKey: "navSection.myCareer",
    items: [
      { labelKey: "nav.credentials", href: "/candidate/credentials", icon: Wallet },
      { labelKey: "nav.applications", href: "/candidate/applications", icon: ClipboardList },
    ],
  },
  {
    labelKey: "navSection.findWork",
    items: [
      { labelKey: "nav.recommendations", href: "/candidate/recommendations", icon: Sparkles },
      { labelKey: "nav.findJobs", href: "/candidate/jobs", icon: Search },
    ],
  },
  settingsSection("candidate", UserCircle),
];

const RECRUITER_NAV: NavSection[] = [
  {
    items: [
      { labelKey: "nav.dashboard", href: "/recruiter/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    labelKey: "navSection.hiring",
    items: [
      { labelKey: "nav.myJobs", href: "/recruiter/jobs", icon: Briefcase },
    ],
  },
  settingsSection("recruiter", Building2),
];

export const NAV_BY_ROLE: Record<UserRole, NavSection[]> = {
  admin: ADMIN_NAV,
  issuer: ISSUER_NAV,
  candidate: CANDIDATE_NAV,
  recruiter: RECRUITER_NAV,
};

export const WORKSPACE_KEY: Record<UserRole, TranslationKey> = {
  admin: "workspace.admin",
  issuer: "workspace.issuer",
  candidate: "workspace.candidate",
  recruiter: "workspace.recruiter",
};
