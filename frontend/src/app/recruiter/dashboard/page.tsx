import { PageHeader } from "@/components/app-shell/PageHeader";

export default function RecruiterDashboardPage() {
  return (
    <>
      <PageHeader
        title="Recruiter hub"
        description="Coming soon — post jobs and review AI-ranked, blockchain-verified candidates."
      />
      <div className="rounded-2xl border border-dashed border-border bg-canvas p-10 text-center text-fg-subtle">
        Recruiter module is on the roadmap.
      </div>
    </>
  );
}
