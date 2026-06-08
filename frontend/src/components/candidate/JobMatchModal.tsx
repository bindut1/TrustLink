"use client";

import { Bookmark, Building2, GraduationCap, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { MatchScoreBar } from "@/components/ui/MatchScoreBar";
import { Modal } from "@/components/ui/Modal";
import { SkillTag } from "@/components/ui/SkillTag";
import { RecruiterInfoModal } from "./RecruiterInfoModal";
import { fetchLearningPath } from "@/lib/candidate-api";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type {
  CandidateSkill,
  LearningRecommendation,
  RankedJob,
} from "@/types/candidate";
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
  const [learning, setLearning] = useState<LearningRecommendation[]>([]);

  useEffect(() => {
    if (!job) return;
    let active = true;
    fetchLearningPath(job.id)
      .then((res) => {
        if (active) setLearning(res.recommendations);
      })
      .catch(() => {
        if (active) setLearning([]);
      });
    return () => {
      active = false;
    };
  }, [job]);

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
  const exp = ranked.explanation;

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

        {/* Why match — trust-aware breakdown from the backend explanation */}
        {required.length > 0 && (
          <div>
            <div className="text-[13px] font-semibold text-fg mb-2.5">
              {t("candidate.recs.requiredSkills")}
            </div>
            {exp ? (
              <div className="flex flex-col gap-3">
                {exp.matchedVerified.length > 0 && (
                  <SkillGroup
                    label={t("candidate.recs.matchedVerified")}
                    tone="verified"
                    skills={exp.matchedVerified}
                  />
                )}
                {exp.matchedClaimedOnly.length > 0 && (
                  <SkillGroup
                    label={t("candidate.recs.matchedClaimed")}
                    tone="claimed"
                    skills={exp.matchedClaimedOnly}
                  />
                )}
                {exp.missing.length > 0 && (
                  <SkillGroup
                    label={t("candidate.recs.missingSkills")}
                    tone="missing"
                    skills={exp.missing}
                  />
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {required.map((skill) => (
                  <SkillTag
                    key={skill}
                    verified={verifiedSet.has(skill.trim().toLowerCase())}
                  >
                    {skill}
                  </SkillTag>
                ))}
              </div>
            )}
            <p className="mt-3 flex items-center gap-1.5 text-[13px] text-teal font-medium">
              <ShieldCheck size={14} />
              {t("candidate.recs.skillsVerified")
                .replace("{n}", String(exp ? exp.matchedVerified.length : verifiedCount))
                .replace("{total}", String(required.length))}
            </p>
          </div>
        )}

        {/* Learning path — close the gap (closes the verify ↔ match loop) */}
        {learning.some((r) => r.recommendedCredential) && (
          <div className="rounded-card border border-border bg-surface-2/40 px-5 py-4">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-fg">
              <GraduationCap size={15} className="text-navy" />
              {t("candidate.recs.learningPath")}
            </div>
            <p className="mt-1 text-[12px] text-fg-faint">
              {t("candidate.recs.learningPathHint")}
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {learning
                .filter((r) => r.recommendedCredential)
                .map((r) => (
                  <li
                    key={`${r.status}-${r.skill}`}
                    className="flex items-center gap-2 text-[13px]"
                  >
                    <SkillTag verified={false} size="sm">
                      {r.skill}
                    </SkillTag>
                    <span className="text-[11px] text-fg-faint">
                      {r.status === "missing"
                        ? t("candidate.recs.statusMissing")
                        : t("candidate.recs.statusUnverified")}
                    </span>
                    <span className="text-fg-faint">→</span>
                    <span className="inline-flex items-center gap-1 font-medium text-navy">
                      <GraduationCap size={13} />
                      {r.recommendedCredential!.name}
                    </span>
                  </li>
                ))}
            </ul>
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

function SkillGroup({
  label,
  tone,
  skills,
}: {
  label: string;
  tone: "verified" | "claimed" | "missing";
  skills: string[];
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-subtle">
        <span
          aria-hidden
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            tone === "verified" && "bg-teal",
            tone === "claimed" && "bg-navy",
            tone === "missing" && "bg-fg-faint",
          )}
        />
        {label}
        <span className="text-fg-faint">· {skills.length}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill) => (
          <SkillTag
            key={skill}
            verified={tone === "verified"}
            className={cn(tone === "missing" && "opacity-55 line-through")}
          >
            {skill}
          </SkillTag>
        ))}
      </div>
    </div>
  );
}

function formatSalary(min?: number | null, max?: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => `${Math.round(n / 1_000_000)}M`;
  if (min && max) return `${fmt(min)} – ${fmt(max)} VND`;
  return `${fmt((min ?? max)!)}+ VND`;
}
