"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { JobForm } from "@/components/recruiter/JobForm";
import { createJob } from "@/lib/recruiter-api";

export default function NewJobPage() {
  const router = useRouter();
  return (
    <>
      <PageHeader
        title="Post a new job"
        description="Saved as a draft. You can publish it from the job detail page once you're happy with the content."
      />
      <JobForm
        submitLabel="Save as draft"
        onSubmit={async (payload) => {
          const job = await createJob(payload);
          router.push(`/recruiter/jobs/${job.id}`);
        }}
      />
    </>
  );
}
