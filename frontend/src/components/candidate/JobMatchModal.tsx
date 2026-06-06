"use client";

import { Bookmark, Building2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { MatchScoreBar } from "@/components/ui/MatchScoreBar";
import { Modal } from "@/components/ui/Modal";
import { SkillTag } from "@/components/ui/SkillTag";
import { RecruiterInfoModal } from "./RecruiterInfoModal";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { CandidateSkill, RankedJob } from "@/types/candidate";
import type { JobItem } from "@/types/candidate";

type Props = {
  job: JobItem | null;
  ranked: RankedJob | null;
  skills: CandidateSkill[];
  applied: boolean;
  onClose: () => void;
  onApply: () => void;
};

export function JobMatchModal({
  job,
  ranked,
  skills,
  applied,
  onClose,
  onApply,
}: Props) {
  const { t } = useLanguage();
  const [showRecruiter, setShowRecruiter] = useState(false);
  if (!job || !ranked) return null;

  const verifiedSet = new Set(
    skills
      .filter((s) => s.isVerified)
      .map((s) => s.skillName.trim().toLowerCase()),
  );
  const required = job.requiredSkills ?? [];
  const verifiedCount = required.filter((s) =>
    verifiedSet.has(s.trim().toLowerCase()),
  ).length;

  const meta = [
    job.city || (job.isRemote ? t("common.remote") : null),
    formatSalary(job.salaryMin, job.salaryMax),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
    <Modal
      open={Boolean(job)}
      onClose={onClose}
      size="lg"
      title={job.title}
      description={meta || undefined}
      footer={
        <>
          <Button
            variant="secondary"
            className="mr-auto"
            leftIcon={<Building2 size={15} />}
            onClick={() => setShowRecruiter(true)}
          >
            {t("jobModal.viewRecruiter")}
          </Button>
          <Button variant="secondary" onClick={onClose} leftIcon={<Bookmark size={15} />}>
            {t("common.save")}
          </Button>
          <Button
            variant="verified"
            onClick={onApply}
            disabled={applied}
            leftIcon={<ShieldCheck size={15} />}
          >
            {applied ? t("candidate.recs.applied") : t("candidate.recs.applyVerified")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Score panel */}
        <div className="rounded-card bg-surface-2/60 border border-border px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.10em] text-fg-faint mb-3">
            {t("candidate.recs.whyMatch")}
          </div>
          <MatchScoreBar
            breakdown={ranked}
            variant="detailed"
            labels={{
              match: t("candidate.recs.match"),
              keyword: t("score.keyword"),
              semantic: t("score.semantic"),
              verified: t("score.verified"),
              weight: t("score.weight").replace("{percentage}", "").replace(/[(){}]/g, "").trim(),
            }}
          />
        </div>

        {/* Required skills */}
        {required.length > 0 && (
          <div>
            <div className="text-[13px] font-semibold text-fg mb-2.5">
              {t("candidate.recs.requiredSkills")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {required.map((skill) => {
                const isVerified = verifiedSet.has(skill.trim().toLowerCase());
                return (
                  <SkillTag key={skill} verified={isVerified}>
                    {skill}
                  </SkillTag>
                );
              })}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[13px] text-teal font-medium">
              <ShieldCheck size={14} />
              {t("candidate.recs.skillsVerified")
                .replace("{n}", String(verifiedCount))
                .replace("{total}", String(required.length))}
            </p>
          </div>
        )}
      </div>
    </Modal>
    <RecruiterInfoModal
      recruiterId={showRecruiter ? job.recruiterId : null}
      onClose={() => setShowRecruiter(false)}
    />
    </>
  );
}

function formatSalary(min?: number | null, max?: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => `${Math.round(n / 1_000_000)}M`;
  if (min && max) return `${fmt(min)} – ${fmt(max)} VND`;
  return `${fmt((min ?? max)!)}+ VND`;
}
