"use client";

import { Award } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSetPageMeta } from "@/components/app-shell/page-meta";
import {
  CredentialDetailDrawer,
  categoryIcon,
  credentialPill,
} from "@/components/candidate/CredentialDetailDrawer";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { SkillTag } from "@/components/ui/SkillTag";
import { StatusPill } from "@/components/ui/StatusPill";
import { cn } from "@/lib/cn";
import { ApiError } from "@/lib/api";
import { fetchMyCredentials, fetchMySkills } from "@/lib/candidate-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { CandidateSkill } from "@/types/candidate";
import type { Credential } from "@/types/issuer";

export default function CandidateCredentialsPage() {
  const { t } = useLanguage();
  useSetPageMeta(
    t("candidate.credentials.title"),
    t("candidate.credentials.description"),
  );

  const [items, setItems] = useState<Credential[] | null>(null);
  const [skills, setSkills] = useState<CandidateSkill[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("all");
  const [selected, setSelected] = useState<Credential | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMyCredentials()
      .then((r) => !cancelled && setItems(r))
      .catch((e: unknown) => {
        if (!cancelled)
          setError(
            e instanceof ApiError ? e.message : t("issuer.credentials.failedLoad"),
          );
      });
    fetchMySkills()
      .then((s) => !cancelled && setSkills(s))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tabs from the categories actually present in the wallet.
  const categories = useMemo(() => {
    if (!items) return [];
    const set = new Set<string>();
    for (const c of items) {
      const cat = c.credentialType?.category;
      if (cat) set.add(cat);
    }
    return [...set];
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    if (tab === "all") return items;
    return items.filter((c) => c.credentialType?.category === tab);
  }, [items, tab]);

  return (
    <>
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Filter tabs */}
      {items && items.length > 0 && (
        <div role="tablist" className="flex flex-wrap gap-1 mb-5">
          <Tab active={tab === "all"} onClick={() => setTab("all")}>
            {t("candidate.credentials.all")}
          </Tab>
          {categories.map((cat) => (
            <Tab key={cat} active={tab === cat} onClick={() => setTab(cat)}>
              {t(`credCategory.${cat}` as TranslationKey)}
            </Tab>
          ))}
        </div>
      )}

      {!items ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Award}
          title={t("candidate.credentials.emptyTitle")}
          description={t("candidate.credentials.emptyDesc")}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <CredentialCard
              key={c.id}
              credential={c}
              skills={skills}
              onOpen={() => setSelected(c)}
            />
          ))}
        </div>
      )}

      <CredentialDetailDrawer
        credential={selected}
        skills={skills}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "h-9 px-3.5 rounded-ctl text-[13.5px] font-medium transition-colors duration-150",
        active
          ? "bg-navy text-on-navy"
          : "text-fg-muted hover:text-fg hover:bg-surface-2",
      )}
    >
      {children}
    </button>
  );
}

const ACCENT: Record<string, string> = {
  "on-chain": "before:bg-teal",
  verified: "before:bg-teal",
  pending: "before:bg-warn",
  revoked: "before:bg-danger",
  neutral: "before:bg-border-strong",
};

function CredentialCard({
  credential: c,
  skills,
  onOpen,
}: {
  credential: Credential;
  skills: CandidateSkill[];
  onOpen: () => void;
}) {
  const { t } = useLanguage();
  const Icon = categoryIcon(c.credentialType?.category);
  const pill = credentialPill(c);
  const tags = skills.filter((s) => s.sourceCredentialId === c.id).slice(0, 4);
  const hash = c.blockchainTxHash ?? c.credentialHash;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        "group relative flex flex-col rounded-card border border-border bg-canvas p-5 cursor-pointer overflow-hidden",
        "shadow-[var(--shadow-card)] tl-card-interactive",
        "before:content-[''] before:absolute before:inset-y-0 before:left-0 before:w-1",
        ACCENT[pill.tone] ?? ACCENT.neutral,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40",
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy/8 text-navy">
          <Icon size={18} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          {c.credentialType?.category && (
            <div className="text-[10.5px] uppercase tracking-[0.10em] font-semibold text-fg-faint">
              {t(`credCategory.${c.credentialType.category}` as TranslationKey)}
            </div>
          )}
          <h3 className="text-[15.5px] font-semibold text-fg leading-snug truncate">
            {c.title}
          </h3>
        </div>
        <StatusPill tone={pill.tone}>{t(pill.labelKey)}</StatusPill>
      </div>

      <p className="text-[13px] text-fg-muted mb-3">
        {c.institution?.name ?? "—"}
        {" · "}
        {new Date(c.issuedDate).toLocaleDateString(undefined, {
          month: "short",
          year: "numeric",
        })}
      </p>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.map((s) => (
            <SkillTag key={s.id} size="sm" verified={s.isVerified}>
              {s.skillName}
            </SkillTag>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-2">
        <span className="font-mono text-[12px] text-fg-subtle truncate">
          {hash ? `# ${hash.slice(0, 8)}…${hash.slice(-4)}` : "# —"}
        </span>
        <span className="text-[12.5px] font-medium text-navy group-hover:underline">
          {t("candidate.credentials.viewDetail")}
        </span>
      </div>
    </article>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-card border border-border bg-canvas p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3 mb-3">
        <Skeleton width={40} height={40} className="rounded-xl" />
        <div className="flex-1">
          <Skeleton height={10} className="w-20 mb-2" />
          <Skeleton height={16} className="w-3/4" />
        </div>
      </div>
      <Skeleton height={12} className="w-1/2 mb-4" />
      <div className="flex gap-1.5">
        <Skeleton height={22} className="w-16 rounded-md" />
        <Skeleton height={22} className="w-16 rounded-md" />
      </div>
    </div>
  );
}
