import { PageHeader } from "@/components/app-shell/PageHeader";

export default function IssuerDashboardPage() {
  return (
    <>
      <PageHeader
        title="Issuer dashboard"
        description="Coming soon — issue, batch import, and revoke verifiable credentials."
      />
      <div className="rounded-2xl border border-dashed border-border bg-canvas p-10 text-center text-fg-subtle">
        Issuer module is on the roadmap.
      </div>
    </>
  );
}
