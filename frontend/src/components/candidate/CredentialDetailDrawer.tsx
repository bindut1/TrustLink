"use client";

import {
  Award,
  BadgeCheck,
  CheckCircle2,
  Cpu,
  Download,
  ExternalLink,
  GraduationCap,
  Languages,
  ShieldCheck,
  Trophy,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { SkillTag } from "@/components/ui/SkillTag";
import { StatusPill, type StatusTone } from "@/components/ui/StatusPill";
import { ApiError } from "@/lib/api";
import {
  downloadVc,
  verifyCredential,
  type VerificationResult,
} from "@/lib/candidate-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { CandidateSkill } from "@/types/candidate";
import type { Credential, CredentialStatus } from "@/types/issuer";

const EXPLORER = "https://amoy.polygonscan.com/tx";

/** Category → icon + tone (navy-tinted; teal stays reserved for verified). */
export const CATEGORY_ICON: Record<string, LucideIcon> = {
  degree: GraduationCap,
  it_certificate: Cpu,
  language_certificate: Languages,
  award: Trophy,
  professional_certificate: BadgeCheck,
  other: Award,
};

export function categoryIcon(category?: string | null): LucideIcon {
  return (category && CATEGORY_ICON[category]) || Award;
}

/** Map a credential's status to a StatusPill tone + i18n label key. */
export function credentialPill(c: Credential): {
  tone: StatusTone;
  labelKey: TranslationKey;
} {
  const onChain = Boolean(c.blockchainTxHash);
  const map: Record<CredentialStatus, { tone: StatusTone; labelKey: TranslationKey }> = {
    issued: onChain
      ? { tone: "on-chain", labelKey: "candidate.credentials.onChain" }
      : { tone: "verified", labelKey: "status.cred.issued" },
    reissued: { tone: "on-chain", labelKey: "status.cred.reissued" },
    pending: { tone: "pending", labelKey: "status.cred.pending" },
    revoked: { tone: "revoked", labelKey: "status.cred.revoked" },
  };
  return map[c.status];
}

type Props = {
  credential: Credential | null;
  skills: CandidateSkill[];
  onClose: () => void;
};

export function CredentialDetailDrawer({ credential, skills, onClose }: Props) {
  const { t } = useLanguage();
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset transient state whenever a different credential is opened.
  useEffect(() => {
    setResult(null);
    setError(null);
    setVerifying(false);
    setDownloading(false);
  }, [credential?.id]);

  if (!credential) return null;

  const c = credential;
  const Icon = categoryIcon(c.credentialType?.category);
  const pill = credentialPill(c);
  const isFinal = c.status === "issued" || c.status === "reissued";
  const credentialSkills = skills.filter((s) => s.sourceCredentialId === c.id);
  const metaEntries = Object.entries(c.metadata ?? {}).filter(
    ([, v]) => v != null && v !== "",
  );

  async function handleVerify() {
    setVerifying(true);
    setError(null);
    try {
      setResult(await verifyCredential(c.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("candidate.credentials.verifyFailed"));
    } finally {
      setVerifying(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    setError(null);
    try {
      await downloadVc(c.id, `${c.credentialNumber || c.id}.vc.json`);
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 403
          ? t("candidate.credentials.downloadForbidden")
          : t("candidate.credentials.downloadFailed"),
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Drawer
      open={Boolean(credential)}
      onClose={onClose}
      width={500}
      title={c.title}
      description={
        c.credentialType?.name ??
        (c.credentialType?.category
          ? t(`credCategory.${c.credentialType.category}` as TranslationKey)
          : undefined)
      }
      footer={
        <div className="flex w-full items-center gap-2">
          <Button
            variant="primary"
            block
            onClick={handleDownload}
            loading={downloading}
            disabled={!isFinal}
            leftIcon={<Download size={15} />}
          >
            {t("candidate.credentials.downloadVc")}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Identity */}
        <div className="flex items-start gap-3">
          <span className="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-navy/8 text-navy">
            <Icon size={20} strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <StatusPill tone={pill.tone}>{t(pill.labelKey)}</StatusPill>
          </div>
        </div>

        {error && (
          <div className="rounded-ctl border border-danger/30 bg-danger/[0.06] px-3.5 py-2.5 text-[13px] text-danger">
            {error}
          </div>
        )}

        {/* Facts */}
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[13px]">
          <Row label={t("candidate.credentials.issuer")}>
            {c.institution?.name ?? "—"}
          </Row>
          <Row label={t("candidate.credentials.issued")}>
            {new Date(c.issuedDate).toLocaleDateString()}
          </Row>
          {c.expiryDate && (
            <Row label={t("candidate.credentials.expires")}>
              {new Date(c.expiryDate).toLocaleDateString()}
            </Row>
          )}
          <Row label={t("candidate.credentials.credentialId")} mono>
            {c.credentialNumber}
          </Row>
          {c.blockchainTxHash && (
            <Row label={t("candidate.credentials.transaction")}>
              <a
                href={`${EXPLORER}/${c.blockchainTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[12.5px] text-navy hover:underline"
              >
                {`${c.blockchainTxHash.slice(0, 10)}…${c.blockchainTxHash.slice(-8)}`}
                <ExternalLink size={12} />
              </a>
            </Row>
          )}
        </dl>

        {/* Skills */}
        {credentialSkills.length > 0 && (
          <Section title={t("candidate.credentials.skills")}>
            <div className="flex flex-wrap gap-1.5">
              {credentialSkills.map((s) => (
                <SkillTag key={s.id} verified={s.isVerified}>
                  {s.skillName}
                </SkillTag>
              ))}
            </div>
          </Section>
        )}

        {/* Metadata */}
        {metaEntries.length > 0 && (
          <Section title={t("candidate.credentials.details")}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[13px]">
              {metaEntries.map(([k, v]) => (
                <Row key={k} label={humanize(k)}>
                  {String(v)}
                </Row>
              ))}
            </dl>
          </Section>
        )}

        {/* Verification */}
        <Section title={t("candidate.credentials.verification")}>
          {result ? (
            <div
              className={`rounded-ctl border px-3.5 py-3 ${
                result.result === "valid"
                  ? "border-teal/30 bg-teal-050"
                  : "border-danger/30 bg-danger/[0.06]"
              }`}
            >
              <div
                className={`flex items-center gap-2 text-[13px] font-semibold mb-2.5 ${
                  result.result === "valid" ? "text-teal" : "text-danger"
                }`}
              >
                {result.result === "valid" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <XCircle size={16} />
                )}
                {result.result === "valid"
                  ? t("candidate.credentials.authentic")
                  : t("candidate.credentials.verifyResult").replace("{result}", result.result)}
              </div>
              <ul className="flex flex-col gap-2">
                <CheckRow ok={result.onChainVerified} label={t("candidate.credentials.onChain")} />
                <CheckRow ok={result.vcSignatureValid} label={t("candidate.credentials.vcSignature")} />
                <CheckRow ok={result.issuerAuthorized} label={t("candidate.credentials.issuerAuthorized")} />
              </ul>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12.5px] text-fg-subtle leading-snug">
                {t("candidate.credentials.verifyHint")}
              </p>
              <Button
                variant="verified"
                size="sm"
                onClick={handleVerify}
                loading={verifying}
                disabled={!isFinal}
                leftIcon={<ShieldCheck size={14} />}
              >
                {t("candidate.credentials.verify")}
              </Button>
            </div>
          )}
        </Section>
      </div>
    </Drawer>
  );
}

function Row({
  label,
  mono,
  children,
}: {
  label: string;
  mono?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="text-fg-subtle whitespace-nowrap">{label}</dt>
      <dd className={`text-fg text-right ${mono ? "font-mono text-[12.5px]" : ""}`}>
        {children}
      </dd>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2.5 text-[11.5px] uppercase tracking-[0.10em] font-semibold text-fg-subtle">
        {title}
      </div>
      {children}
    </section>
  );
}

function CheckRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-[13px]">
      {ok ? (
        <CheckCircle2 size={14} className="text-teal shrink-0" />
      ) : (
        <XCircle size={14} className="text-danger shrink-0" />
      )}
      <span className="text-fg-muted">{label}</span>
    </li>
  );
}

function humanize(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (c) => c.toUpperCase());
}
