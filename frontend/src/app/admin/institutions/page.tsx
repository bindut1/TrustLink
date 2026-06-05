"use client";

import { useEffect, useState } from "react";
import { useSetPageMeta } from "@/components/app-shell/page-meta";
import { InstitutionCard } from "@/components/admin/InstitutionCard";
import { fetchInstitutions } from "@/lib/admin-api";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { AdminInstitution, ApprovalStatus } from "@/types/admin";

type FilterTab = "pending" | "approved" | "rejected" | "all";

const TABS: { key: FilterTab; labelKey: TranslationKey }[] = [
  { key: "pending", labelKey: "admin.institutions.tabPending" },
  { key: "approved", labelKey: "admin.institutions.tabApproved" },
  { key: "rejected", labelKey: "admin.institutions.tabRejected" },
  { key: "all", labelKey: "admin.institutions.tabAll" },
];

export default function AdminInstitutionsPage() {
  const { t } = useLanguage();
  useSetPageMeta(
    t("admin.institutions.title"),
    t("admin.institutions.description"),
  );
  const [tab, setTab] = useState<FilterTab>("pending");
  const [items, setItems] = useState<AdminInstitution[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    fetchInstitutions({ status: tab }).then((r) => {
      if (!cancelled) setItems(r);
    });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  function handleChange(next: AdminInstitution) {
    setItems((prev) => {
      if (!prev) return prev;
      const updated = prev.map((x) => (x.id === next.id ? next : x));
      if (tab === "all") return updated;
      return updated.filter((x) => x.approvalStatus === (tab as ApprovalStatus));
    });
  }

  return (
    <>
      <div role="tablist" className="flex flex-wrap gap-1 mb-5">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.key}
            type="button"
            role="tab"
            aria-selected={tab === tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={cn(
              "h-9 px-3.5 rounded-md text-[13.5px] font-medium transition-colors",
              tab === tabItem.key
                ? "bg-surface-2 text-fg border border-border"
                : "text-fg-muted hover:text-fg hover:bg-surface-2/60",
            )}
          >
            {t(tabItem.labelKey)}
          </button>
        ))}
      </div>

      {!items ? (
        <div className="rounded-2xl border border-border bg-canvas p-10 text-center text-fg-subtle">
          {t("common.loading")}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-canvas p-10 text-center text-fg-subtle">
          {t("admin.institutions.empty")}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((inst) => (
            <InstitutionCard
              key={inst.id}
              institution={inst}
              onChange={handleChange}
            />
          ))}
        </div>
      )}
    </>
  );
}
