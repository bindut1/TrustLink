import { PageHeader } from "@/components/app-shell/PageHeader";

export default function CandidateDashboardPage() {
  return (
    <>
      <PageHeader
        title="Candidate workspace"
        description="Coming soon — your verified credentials, applications, and AI job matches."
      />
      <div className="rounded-2xl border border-dashed border-border bg-canvas p-10 text-center text-fg-subtle">
        Candidate module is on the roadmap.
      </div>
    </>
  );
}
