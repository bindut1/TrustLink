"use client";

import {
  Briefcase,
  Calendar,
  ExternalLink,
  FileText,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { CandidateProfile } from "@/types/recruiter-app";

export type CandidateInfoData = {
  candidate: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
    candidateProfile?: CandidateProfile | null;
  };
  coverLetter?: string | null;
};

type Props = {
  data: CandidateInfoData | null;
  onClose: () => void;
};

export function CandidateInfoModal({ data, onClose }: Props) {
  const { t } = useLanguage();

  if (!data) return null;

  const { candidate, coverLetter } = data;
  const p = candidate.candidateProfile;

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={t("candInfo.title")}
      footer={
        <Button variant="secondary" onClick={onClose}>
          {t("common.close")}
        </Button>
      }
    >
      {/* ── Header ── */}
      <div className="flex items-start gap-4 pb-5 mb-5 border-b border-border">
        <Avatar name={candidate.fullName} src={candidate.avatarUrl} size={56} />
        <div className="min-w-0 flex-1">
          <div className="text-[19px] font-bold text-fg tracking-[-0.018em] leading-tight">
            {candidate.fullName}
          </div>
          {p?.desiredPosition && (
            <div className="text-[13.5px] text-accent mt-0.5 font-medium">
              {p.desiredPosition}
            </div>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            <span className="inline-flex items-center gap-1.5 text-[13px] text-fg-subtle">
              <Mail size={13} />
              {candidate.email}
            </span>
            {candidate.phone && (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-fg-subtle">
                <Phone size={13} />
                {candidate.phone}
              </span>
            )}
          </div>
          {/* Open to work badge */}
          {p?.isOpenToWork && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/[0.08] px-3 py-0.5 text-[12px] text-success font-medium">
              {t("candInfo.openToWork")}
            </span>
          )}
        </div>
      </div>

      {!p ? (
        <p className="text-[13.5px] text-fg-subtle text-center py-4">
          {t("candInfo.noProfile")}
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {/* ── Quick stats row ── */}
          <div className="grid grid-cols-2 gap-3">
            {p.yearsOfExperience != null && p.yearsOfExperience > 0 && (
              <StatCard
                icon={<Briefcase size={14} />}
                label={t("candInfo.yearsExp")}
                value={t("candInfo.yearsExpValue").replace("{n}", String(p.yearsOfExperience))}
              />
            )}
            {p.gender && (
              <StatCard
                icon={<User size={14} />}
                label={t("candInfo.gender")}
                value={genderLabel(p.gender, t)}
              />
            )}
            {p.dateOfBirth && (
              <StatCard
                icon={<Calendar size={14} />}
                label={t("candInfo.dateOfBirth")}
                value={new Date(p.dateOfBirth).toLocaleDateString("vi-VN")}
              />
            )}
            {(p.desiredSalaryMin != null || p.desiredSalaryMax != null) && (
              <StatCard
                icon={<span className="text-[12px] font-bold">₫</span>}
                label={t("candInfo.salaryExpect")}
                value={formatSalary(p.desiredSalaryMin, p.desiredSalaryMax)}
              />
            )}
          </div>

          {/* ── Bio ── */}
          {p.bio && (
            <Section title={t("candInfo.bio")}>
              <p className="text-[14px] text-fg-muted leading-relaxed whitespace-pre-wrap">
                {p.bio}
              </p>
            </Section>
          )}

          {/* ── Preferred locations ── */}
          {Array.isArray(p.preferredLocations) && p.preferredLocations.length > 0 && (
            <Section title={t("candInfo.preferredLocations")}>
              <div className="flex flex-wrap gap-1.5">
                {(p.preferredLocations as string[]).map((loc) => (
                  <span
                    key={loc}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/60 px-3 py-0.5 text-[13px] text-fg-muted"
                  >
                    <MapPin size={11} className="text-fg-subtle" />
                    {loc}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* ── Links + Resume ── */}
          {(p.linkedinUrl || p.githubUrl || p.portfolioUrl || p.resumeUrl) && (
            <Section title={t("candInfo.links")}>
              <div className="flex flex-wrap gap-2">
                {p.resumeUrl && (
                  <LinkChip
                    href={p.resumeUrl}
                    icon={<FileText size={13} />}
                    label={t("candInfo.resumeView")}
                    accent
                  />
                )}
                {p.linkedinUrl && (
                  <LinkChip
                    href={p.linkedinUrl}
                    icon={<Linkedin size={13} />}
                    label={t("candInfo.linkedin")}
                  />
                )}
                {p.githubUrl && (
                  <LinkChip
                    href={p.githubUrl}
                    icon={<Github size={13} />}
                    label={t("candInfo.github")}
                  />
                )}
                {p.portfolioUrl && (
                  <LinkChip
                    href={p.portfolioUrl}
                    icon={<ExternalLink size={13} />}
                    label={t("candInfo.portfolio")}
                  />
                )}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* ── Cover letter (application context only) ── */}
      {coverLetter !== undefined && (
        <div className="mt-5 pt-5 border-t border-border">
          <div className="text-[11.5px] uppercase tracking-[0.10em] font-semibold text-fg-subtle mb-2">
            {t("candInfo.coverLetter")}
          </div>
          {coverLetter ? (
            <p className="text-[13.5px] text-fg-muted leading-relaxed whitespace-pre-wrap border-l-2 border-border pl-3">
              {coverLetter}
            </p>
          ) : (
            <p className="text-[13px] text-fg-subtle italic">
              {t("candInfo.noCoverLetter")}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11.5px] uppercase tracking-[0.10em] font-semibold text-fg-subtle mb-2">
        {title}
      </div>
      {children}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/40 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-fg-subtle mb-1">
        {icon}
        <span className="text-[11px] uppercase tracking-wide font-semibold">{label}</span>
      </div>
      <div className="text-[13.5px] font-semibold text-fg">{value}</div>
    </div>
  );
}

function LinkChip({
  href,
  icon,
  label,
  accent = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  accent?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={
        accent
          ? "inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/8 px-3 py-1.5 text-[13px] text-accent hover:bg-accent/15 transition-colors"
          : "inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2/60 px-3 py-1.5 text-[13px] text-fg-muted hover:text-fg hover:border-border-strong transition-colors"
      }
    >
      {icon}
      {label}
    </a>
  );
}

function genderLabel(
  gender: string,
  t: (key: "candInfo.gender.male" | "candInfo.gender.female" | "candInfo.gender.other") => string,
): string {
  switch (gender.toLowerCase()) {
    case "male": case "nam": return t("candInfo.gender.male");
    case "female": case "nữ": case "nu": return t("candInfo.gender.female");
    default: return t("candInfo.gender.other");
  }
}

function formatSalary(min?: number | null, max?: number | null): string {
  const fmt = (v: number) =>
    v >= 1000 ? `${(v / 1000).toFixed(1)}M` : `${v}k`;
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)} VND`;
  if (min != null) return `Từ ${fmt(min)} VND`;
  if (max != null) return `Tối đa ${fmt(max)} VND`;
  return "";
}
