"use client";

import { Info } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * Informational note shown alongside any "Download VC" action.
 *
 * The downloaded VC is signed (EIP-712) and anchored on Polygon, so its
 * authenticity does NOT depend on TrustLink staying online. This note tells the
 * holder how to verify the file independently if our public endpoint is ever
 * unavailable — via the blockchain explorer or any third-party W3C VC verifier.
 */
export function VcOfflineVerifyNote() {
  const { t } = useLanguage();
  return (
    <div className="flex gap-2.5 rounded-ctl border border-border bg-surface-2/50 px-3.5 py-3 text-[12.5px] leading-relaxed text-fg-subtle">
      <Info size={15} className="mt-0.5 shrink-0 text-navy" />
      <div>
        <p className="font-semibold text-fg">{t("vc.offlineVerify.title")}</p>
        <p className="mt-1">{t("vc.offlineVerify.body")}</p>
      </div>
    </div>
  );
}
