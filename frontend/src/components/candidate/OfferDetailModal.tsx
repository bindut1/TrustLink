"use client";

import {
  BadgeCheck,
  Building2,
  Globe,
  MapPin,
  Quote,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SkillTag } from "@/components/ui/SkillTag";
import { fetchRecruiterByUserId } from "@/lib/candidate-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Modal } from "@/components/ui/Modal";
import type {
  JobInvitationItem,
  RecruiterPublicProfile,
} from "@/types/candidate";

type Props = {
  invitation: JobInvitationItem | null;
  onClose: () => void;
  onApply: (invitation: JobInvitationItem) => void;
  onDecline: (invitation: JobInvitationItem) => void;
};

/**
 * Candidate-facing offer detail: the recruiter's message, the company behind
 * the offer, a quick job summary, and the apply / decline actions.
 */
export function OfferDetailModal({
  invitation,
  onClose,
  onApply,
  onDecline,
}: Props) {
  const { t } = useLanguage();
  const [recruiter, setRecruiter] = useState<RecruiterPublicProfile | null>(
    null,
  );

  useEffect(() => {
    if (!invitation) return;
    setRecruiter(null);
    let cancelled = false;
    fetchRecruiterByUserId(invitation.recruiterId)
      .then((r) => !cancelled && setRecruiter(r))
      .catch(() => {
        /* recruiter block is best-effort; offer + job still render */
      });
    return () => {
      cancelled = true;
    };
  }, [invitation]);

  if (!invitation) return null;
  const { job } = invitation;
  const declined = invitation.status === "declined";

  return (
    <Modal
      open
      onClose={onClose}
      title={job.title}
      description={t("offerDetail.from").replace(
        "{name}",
        invitation.recruiterName,
      )}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("common.close")}
          </Button>
          {!invitation.hasApplied && !declined && (
            <Button variant="ghost" onClick={() => onDecline(invitation)}>
              {t("offerDetail.decline")}
            </Button>
          )}
          {invitation.hasApplied ? (
            <Button disabled leftIcon={<BadgeCheck size={15} />}>
              {t("jobCard.applied")}
            </Button>
          ) : (
            <Button onClick={() => onApply(invitation)}>
              {t("jobCard.apply")}
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Candidate already declined — show the reason they gave */}
        {declined && (
          <div className="rounded-xl border border-danger/25 bg-danger/[0.05] p-4 text-[13px] text-danger">
            <span className="font-semibold">{t("offerDetail.declined")}</span>
            {invitation.declineReason && (
              <span> · {invitation.declineReason}</span>
            )}
          </div>
        )}

        {/* Recruiter's message */}
        {invitation.message && (
          <div className="rounded-xl border border-navy/15 bg-navy/[0.04] p-4">
            <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-navy">
              <Quote size={13} />
              {t("offerDetail.messageTitle")}
            </div>
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-fg">
              {invitation.message}
            </p>
          </div>
        )}

        {/* Company behind the offer */}
        <section>
          <div className="mb-2.5 text-[11.5px] uppercase tracking-[0.10em] font-semibold text-fg-subtle">
            {t("offerDetail.recruiterTitle")}
          </div>
          {recruiter ? (
            <div className="rounded-xl border border-border bg-surface-1 p-4">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-fg-subtle" />
                <span className="text-[15px] font-semibold text-fg">
                  {recruiter.companyName}
                </span>
                {recruiter.isVerified && (
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-success">
                    <BadgeCheck size={13} />
                    {t("recruiterInfo.verified")}
                  </span>
                )}
              </div>
              <dl className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[13px]">
                {recruiter.industry && (
                  <InfoRow
                    icon={<Building2 size={13} />}
                    label={t("recruiterInfo.industry")}
                    value={recruiter.industry}
                  />
                )}
                {recruiter.companySize && (
                  <InfoRow
                    icon={<Users size={13} />}
                    label={t("recruiterInfo.size")}
                    value={t("recruiter.profile.fldEmployees").replace(
                      "{size}",
                      recruiter.companySize,
                    )}
                  />
                )}
                {(recruiter.city || recruiter.country) && (
                  <InfoRow
                    icon={<MapPin size={13} />}
                    label={t("recruiterInfo.location")}
                    value={[recruiter.city, recruiter.country]
                      .filter(Boolean)
                      .join(", ")}
                  />
                )}
                {recruiter.companyWebsite && (
                  <InfoRow
                    icon={<Globe size={13} />}
                    label={t("recruiterInfo.website")}
                    value={
                      <a
                        href={recruiter.companyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-navy hover:underline"
                      >
                        {recruiter.companyWebsite}
                      </a>
                    }
                  />
                )}
              </dl>
              {recruiter.description && (
                <p className="mt-3 text-[13px] leading-relaxed text-fg-muted">
                  {recruiter.description}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface-1 p-4 text-[13px] text-fg-subtle">
              {invitation.recruiterName}
            </div>
          )}
        </section>

        {/* Job summary */}
        <section>
          <div className="mb-2.5 text-[11.5px] uppercase tracking-[0.10em] font-semibold text-fg-subtle">
            {t("offerDetail.jobTitle")}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-fg-muted">
            {job.city && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} className="text-fg-subtle" />
                {job.city}
              </span>
            )}
            {job.isRemote && <span>{t("common.remote")}</span>}
          </div>
          {job.requiredSkills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.requiredSkills.map((s) => (
                <SkillTag key={s}>{s}</SkillTag>
              ))}
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-fg-subtle">{icon}</span>
      <span className="text-fg-subtle">{label}:</span>
      <span className="text-fg font-medium truncate">{value}</span>
    </div>
  );
}
