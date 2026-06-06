"use client";

import { Building2, Globe, MapPin, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchRecruiterByUserId } from "@/lib/candidate-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { RecruiterPublicProfile } from "@/types/candidate";

type Props = {
  /** Recruiter user id (= Job.recruiterId). Null = modal closed. */
  recruiterId: string | null;
  onClose: () => void;
};

export function RecruiterInfoModal({ recruiterId, onClose }: Props) {
  const { t } = useLanguage();
  const [data, setData] = useState<RecruiterPublicProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recruiterId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    fetchRecruiterByUserId(recruiterId)
      .then((d) => !cancelled && setData(d))
      .catch(
        (e: unknown) =>
          !cancelled &&
          setError(
            e instanceof Error ? e.message : t("recruiterInfo.loadFailed"),
          ),
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recruiterId]);

  return (
    <Modal
      open={Boolean(recruiterId)}
      onClose={onClose}
      size="md"
      title={t("recruiterInfo.title")}
    >
      {loading ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Skeleton width={56} height={56} className="rounded-xl" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton height={18} className="rounded w-1/2" />
              <Skeleton height={13} className="rounded w-1/3" />
            </div>
          </div>
          <Skeleton height={60} className="rounded-card" />
        </div>
      ) : error ? (
        <p className="text-[13.5px] text-fg-subtle py-2">
          {t("recruiterInfo.empty")}
        </p>
      ) : data ? (
        <RecruiterContent data={data} />
      ) : null}
    </Modal>
  );
}

function RecruiterContent({ data }: { data: RecruiterPublicProfile }) {
  const { t } = useLanguage();
  const location = [data.city, data.country].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-5">
      {/* Header: logo + name + verified */}
      <div className="flex items-start gap-4">
        <CompanyLogo url={data.companyLogoUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[17px] font-bold tracking-[-0.015em] text-fg leading-snug">
              {data.companyName}
            </h3>
            {data.isVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-050 px-2 py-0.5 text-[11.5px] font-semibold text-teal">
                <ShieldCheck size={12} />
                {t("recruiterInfo.verified")}
              </span>
            )}
          </div>
          {data.companyNameEn && (
            <p className="mt-0.5 text-[13px] text-fg-subtle">
              {data.companyNameEn}
            </p>
          )}
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        {data.industry && (
          <MetaRow
            icon={<Building2 size={15} />}
            label={t("recruiterInfo.industry")}
            value={data.industry}
          />
        )}
        {data.companySize && (
          <MetaRow
            icon={<Users size={15} />}
            label={t("recruiterInfo.size")}
            value={data.companySize}
          />
        )}
        {(location || data.companyAddress) && (
          <MetaRow
            icon={<MapPin size={15} />}
            label={t("recruiterInfo.location")}
            value={data.companyAddress || location}
          />
        )}
        {data.companyWebsite && (
          <MetaRow
            icon={<Globe size={15} />}
            label={t("recruiterInfo.website")}
            value={
              <a
                href={normalizeUrl(data.companyWebsite)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-navy font-medium hover:underline break-all"
              >
                {data.companyWebsite.replace(/^https?:\/\//, "")}
              </a>
            }
          />
        )}
      </div>

      {/* About */}
      {data.description && (
        <div className="pt-1 border-t border-border">
          <div className="text-[11.5px] uppercase tracking-[0.10em] font-semibold text-fg-subtle mt-4 mb-2">
            {t("recruiterInfo.about")}
          </div>
          <p className="text-[14px] text-fg-muted leading-relaxed whitespace-pre-wrap">
            {data.description}
          </p>
        </div>
      )}
    </div>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-fg-subtle shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-[11.5px] text-fg-faint">{label}</div>
        <div className="text-[14px] text-fg leading-snug">{value}</div>
      </div>
    </div>
  );
}

function CompanyLogo({ url }: { url?: string | null }) {
  const [err, setErr] = useState(false);
  if (url && !err) {
    return (
      // Company logos are arbitrary external domains → plain <img> avoids
      // next/image remotePatterns config; fallback handled on error.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        onError={() => setErr(true)}
        className="h-14 w-14 shrink-0 rounded-xl border border-border object-contain bg-canvas"
      />
    );
  }
  return (
    <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-2 text-fg-subtle">
      <Building2 size={24} strokeWidth={1.6} />
    </span>
  );
}

function normalizeUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
