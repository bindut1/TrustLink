"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * Public verify link + scannable QR for a credential. Anyone (recruiter,
 * third party) can open `/verify/:id` to independently verify on-chain — the
 * link is the bridge between the holder's wallet/app and public verification.
 */
export function ShareCredential({ credentialId }: { credentialId: string }) {
  const { t } = useLanguage();
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  // window is unavailable during SSR; resolve the absolute URL on the client.
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const url = useMemo(
    () => `${origin}/verify/${credentialId}`,
    [origin, credentialId],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — link is still shown for manual copy */
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-ctl border border-border bg-surface-2/40 px-3.5 py-3">
      <div className="shrink-0 rounded-md bg-white p-1.5 ring-1 ring-border">
        {origin ? (
          <QRCodeSVG value={url} size={76} level="M" />
        ) : (
          <div className="h-[76px] w-[76px] animate-pulse rounded bg-surface-2" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11.5px] uppercase tracking-[0.10em] font-semibold text-fg-subtle">
          {t("verify.shareTitle")}
        </p>
        <p className="mt-1 break-all font-mono text-[11.5px] leading-snug text-fg-muted">
          {url}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[12px] font-medium text-fg transition-colors hover:bg-surface-2"
          >
            {copied ? (
              <Check size={13} className="text-teal" />
            ) : (
              <Copy size={13} />
            )}
            {copied ? t("verify.copied") : t("verify.copyLink")}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[12px] font-medium text-navy transition-colors hover:bg-surface-2"
          >
            <ExternalLink size={13} />
            {t("verify.openPage")}
          </a>
        </div>
      </div>
    </div>
  );
}
