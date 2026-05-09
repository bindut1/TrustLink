"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { JobForm } from "@/components/recruiter/JobForm";
import { Alert } from "@/components/ui/Alert";
import { fetchJob, updateJob } from "@/lib/recruiter-api";
import type { JobItem } from "@/types/candidate";

export default function EditJobPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<JobItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    fetchJob(params.id).then(setJob).catch((e: unknown) => {
      setError(e instanceof Error ? e.message : "Failed to load job");
    });
  }, [params?.id]);

  if (error) {
    return (
      <>
        <PageHeader title="Edit job" />
        <Alert variant="error">{error}</Alert>
      </>
    );
  }

  if (!job) {
    return (
      <>
        <PageHeader title="Edit job" />
        <div className="rounded-2xl border border-border bg-canvas p-10 text-center text-fg-subtle">
          Loading…
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit job"
        description="Updates re-generate the AI embedding so candidate matches stay accurate."
      />
      <JobForm
        initial={{
          title: job.title,
          description: job.description,
          requirements: job.requirements ?? "",
          benefits: job.benefits ?? "",
          jobType: job.jobType,
          experienceLevel: job.experienceLevel ?? "",
          industry: job.industry ?? "",
          location: job.location ?? "",
          city: job.city ?? "",
          isRemote: job.isRemote,
          salaryMin: job.salaryMin ?? undefined,
          salaryMax: job.salaryMax ?? undefined,
          salaryVisible: job.salaryVisible,
          requiredSkills: job.requiredSkills,
          preferredSkills: job.preferredSkills ?? [],
          applicationDeadline: job.applicationDeadline ?? undefined,
        }}
        submitLabel="Save changes"
        onSubmit={async (payload) => {
          await updateJob(job.id, payload);
          router.push(`/recruiter/jobs/${job.id}`);
        }}
      />
    </>
  );
}
