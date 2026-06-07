"use client";

import { AlertCircle, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";

/** The four cryptographic checks every verify surface shares. */
export type VerifyOutcome = {
  result: string; // "valid" | "invalid" | "revoked" | "not_found" | "error"
  onChainVerified: boolean;
  vcSignatureValid: boolean;
  issuerAuthorized: boolean;
  contentIntegrityValid: boolean;
};

export type VerifyKind =
  | "valid"
  | "revoked"
  | "invalid"
  | "not_found"
  | "error";

/** Collapse a raw outcome into the one tone the UI should render. */
export function verifyKind(o: VerifyOutcome): VerifyKind {
  if (o.result === "error") return "error";
  if (o.result === "revoked") return "revoked";
  if (o.result === "not_found") return "not_found";
  const allGood =
    o.result === "valid" &&
    o.onChainVerified &&
    o.vcSignatureValid &&
    o.issuerAuthorized &&
    o.contentIntegrityValid;
  return allGood ? "valid" : "invalid";
}

const BADGE: Record<VerifyKind, { cls: string; icon: string; key: TranslationKey }> = {
  valid: {
    cls: "border-teal/40 bg-teal-050 text-teal",
    icon: "✓",
    key: "verify.statusValid",
  },
  revoked: {
    cls: "border-warn/40 bg-warn/[0.08] text-warn",
    icon: "⊘",
    key: "verify.statusRevoked",
  },
  invalid: {
    cls: "border-danger/40 bg-danger/[0.07] text-danger",
    icon: "✗",
    key: "verify.statusInvalid",
  },
  not_found: {
    cls: "border-fg-subtle/30 bg-fg-subtle/[0.06] text-fg-muted",
    icon: "?",
    key: "verify.statusNotFound",
  },
  error: {
    cls: "border-fg-subtle/30 bg-fg-subtle/[0.06] text-fg-muted",
    icon: "!",
    key: "verify.statusError",
  },
};

/** Pill summarising the overall outcome — used in headers. */
export function VerifyBadge({ outcome }: { outcome: VerifyOutcome }) {
  const { t } = useLanguage();
  const b = BADGE[verifyKind(outcome)];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[12.5px] font-semibold ${b.cls}`}
    >
      <span className="text-base leading-none">{b.icon}</span>
      {t(b.key)}
    </span>
  );
}

function CheckRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-[13px]">
      {ok ? (
        <CheckCircle2 size={15} className="text-teal shrink-0" />
      ) : (
        <XCircle size={15} className="text-danger shrink-0" />
      )}
      <span className="text-fg-muted">{label}</span>
    </li>
  );
}

/** Just the four per-check rows (no surrounding card) for compact contexts. */
export function VerifyChecks({ outcome }: { outcome: VerifyOutcome }) {
  const { t } = useLanguage();
  return (
    <ul className="flex flex-col gap-1.5">
      <CheckRow ok={outcome.onChainVerified} label={t("verify.checkOnChain")} />
      <CheckRow
        ok={outcome.contentIntegrityValid}
        label={t("verify.checkContentIntegrity")}
      />
      <CheckRow ok={outcome.vcSignatureValid} label={t("verify.checkSignature")} />
      <CheckRow ok={outcome.issuerAuthorized} label={t("verify.checkIssuer")} />
    </ul>
  );
}

/**
 * The shared verification result block: a tone-coloured card with the overall
 * verdict and the four per-check rows. Drives the public verify page, the
 * candidate drawer and any other single-credential verify surface so they stay
 * visually and semantically identical.
 */
export function VerificationResult({ outcome }: { outcome: VerifyOutcome }) {
  const { t } = useLanguage();
  const kind = verifyKind(outcome);

  if (kind === "error") {
    return (
      <div className="flex items-start gap-2.5 rounded-ctl border border-fg-subtle/25 bg-fg-subtle/[0.05] px-3.5 py-3 text-[12.5px] leading-snug text-fg-muted">
        <AlertCircle size={16} className="mt-px shrink-0" />
        <span>{t("verify.cannotVerifyNow")}</span>
      </div>
    );
  }

  const tone =
    kind === "valid"
      ? "border-teal/30 bg-teal-050"
      : kind === "revoked"
        ? "border-warn/30 bg-warn/[0.06]"
        : kind === "not_found"
          ? "border-fg-subtle/30 bg-fg-subtle/[0.05]"
          : "border-danger/30 bg-danger/[0.06]";
  const headTone =
    kind === "valid"
      ? "text-teal"
      : kind === "revoked"
        ? "text-warn"
        : kind === "not_found"
          ? "text-fg-muted"
          : "text-danger";
  const headKey: TranslationKey =
    kind === "valid"
      ? "verify.authentic"
      : kind === "revoked"
        ? "verify.statusRevoked"
        : kind === "not_found"
          ? "verify.notFoundTitle"
          : "verify.notAuthentic";

  return (
    <div className={`rounded-ctl border px-3.5 py-3 ${tone}`}>
      <div className={`mb-2.5 flex items-center gap-2 text-[13px] font-semibold ${headTone}`}>
        {kind === "valid" ? (
          <ShieldCheck size={16} />
        ) : kind === "not_found" ? (
          <AlertCircle size={16} />
        ) : (
          <XCircle size={16} />
        )}
        {t(headKey)}
      </div>
      {kind === "not_found" && (
        <p className="mb-2.5 text-[12px] leading-snug text-fg-subtle">
          {t("verify.notFoundExplain")}
        </p>
      )}
      <VerifyChecks outcome={outcome} />
    </div>
  );
}
