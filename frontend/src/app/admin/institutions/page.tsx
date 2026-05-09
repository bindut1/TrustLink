"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { InstitutionCard } from "@/components/admin/InstitutionCard";
import { fetchInstitutions } from "@/lib/admin-api";
import { cn } from "@/lib/cn";
import type { AdminInstitution, ApprovalStatus } from "@/types/admin";

type FilterTab = "pending" | "approved" | "rejected" | "all";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

export default function AdminInstitutionsPage() {
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
      // Re-filter so it stays consistent with the current tab
      const updated = prev.map((x) => (x.id === next.id ? next : x));
      if (tab === "all") return updated;
      return updated.filter((x) => x.approvalStatus === (tab as ApprovalStatus));
    });
  }

  return (
    <>
      <PageHeader
        title="Institutions"
        description="Approve issuers to grant them on-chain credential issuance rights."
      />

      <div role="tablist" className="flex flex-wrap gap-1 mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "h-9 px-3.5 rounded-md text-[13.5px] font-medium transition-colors",
              tab === t.key
                ? "bg-surface-2 text-fg border border-border"
                : "text-fg-muted hover:text-fg hover:bg-surface-2/60",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!items ? (
        <div className="rounded-2xl border border-border bg-canvas p-10 text-center text-fg-subtle">
          Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-canvas p-10 text-center text-fg-subtle">
          No institutions in this view.
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
