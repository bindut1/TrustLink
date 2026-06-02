"use client";

import {
  Briefcase,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  Phone,
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

type CandidateInfoModalProps = {
  data: CandidateInfoData | null;
  onClose: () => void;
};

export function CandidateInfoModal({ data, onClose }: CandidateInfoModalProps) {
  const { t } = useLanguage();

  if (!data) return null;

  const { candidate, coverLetter } = data;
  const name = candidate.fullName;
  const profile = candidate.candidateProfile;

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
      {/* Header: avatar + name + email + phone */}
      <div className="flex items-start gap-4 mb-5 pb-5 border-b border-border">
        <Avatar name={name} src={candidate.avatarUrl} size={56} />
        <div className="min-w-0 flex-1">
          <div className="text-[19px] font-bold text-fg tracking-[-0.018em] leading-tight">
            {name}
          </div>
          {profile?.desiredPosition && (
            <div className="text-[13.5px] text-fg-muted mt-0.5">
              {profile.desiredPosition}
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
        </div>
      </div>

      {!profile ? (
        <p className="text-[13.5px] text-fg-subtle text-center py-4">
          {t("candInfo.noProfile")}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Quick stats */}
          <div className="flex flex-wrap gap-3">
            {profile.yearsOfExperience != null &&
              profile.yearsOfExperience > 0 && (
                <Chip
                  icon={<Briefcase size={12} />}
                  label={t("candInfo.yearsExp")}
                  value={t("candInfo.yearsExpValue").replace(
                    "{n}",
                    String(profile.yearsOfExperience),
                  )}
                />
              )}
            {profile.isOpenToWork && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/[0.08] px-3 py-1 text-[12px] text-success font-medium">
                {t("candInfo.openToWork")}
              </span>
            )}
            {(profile.desiredSalaryMin != null ||
              profile.desiredSalaryMax != null) && (
              <Chip
                label={t("candInfo.salaryExpect")}
                value={formatSalary(
                  profile.desiredSalaryMin,
                  profile.desiredSalaryMax,
                )}
              />
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <InfoSection title={t("candInfo.bio")}>
              <p className="text-[13.5px] text-fg-muted leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            </InfoSection>
          )}

          {/* External links */}
          {(profile.linkedinUrl ||
            profile.githubUrl ||
            profile.portfolioUrl) && (
            <InfoSection title={t("candInfo.links")}>
              <div className="flex flex-wrap gap-2">
                {profile.linkedinUrl && (
                  <LinkChip
                    href={profile.linkedinUrl}
                    icon={<Linkedin size={13} />}
                    label={t("candInfo.linkedin")}
                  />
                )}
                {profile.githubUrl && (
                  <LinkChip
                    href={profile.githubUrl}
                    icon={<Github size={13} />}
                    label={t("candInfo.github")}
                  />
                )}
                {profile.portfolioUrl && (
                  <LinkChip
                    href={profile.portfolioUrl}
                    icon={<ExternalLink size={13} />}
                    label={t("candInfo.portfolio")}
                  />
                )}
              </div>
            </InfoSection>
          )}
        </div>
      )}

      {/* Cover letter — only shown when application context is available */}
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

function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[11.5px] uppercase tracking-[0.10em] font-semibold text-fg-subtle mb-1.5">
        {title}
      </div>
      {children}
    </div>
  );
}

function Chip({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/60 px-3 py-1 text-[12.5px] text-fg-muted">
      {icon}
      <span className="text-fg-subtle">{label}:</span>
      {value}
    </span>
  );
}

function LinkChip({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2/60 px-3 py-1.5 text-[13px] text-fg-muted hover:text-fg hover:border-border-strong transition-colors"
      onClick={(e) => e.stopPropagation()}
    >
      {icon}
      {label}
    </a>
  );
}

function formatSalary(min?: number | null, max?: number | null): string {
  const fmt = (v: number) =>
    v >= 1000 ? `${(v / 1000).toFixed(1)}M` : `${v}k`;
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)} VND`;
  if (min != null) return `Từ ${fmt(min)} VND`;
  if (max != null) return `Tối đa ${fmt(max)} VND`;
  return "";
}
