"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { JobForm } from "@/components/recruiter/JobForm";
import { Alert } from "@/components/ui/Alert";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { fetchJob, updateJob } from "@/lib/recruiter-api";
import type { JobItem } from "@/types/candidate";

export default function EditJobPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const [job, setJob] = useState<JobItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    fetchJob(params.id)
      .then(setJob)
      .catch((e: unknown) => {
        setError(
          e instanceof Error ? e.message : t("recruiter.editJob.failedLoad"),
        );
      });
  }, [params?.id, t]);

  if (error) {
    return (
      <>
        <PageHeader title={t("recruiter.editJob.title")} />
        <Alert variant="error">{error}</Alert>
      </>
    );
  }

  if (!job) {
    return (
      <>
        <PageHeader title={t("recruiter.editJob.title")} />
        <div className="rounded-2xl border border-border bg-canvas p-10 text-center text-fg-subtle">
          {t("common.loading")}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t("recruiter.editJob.title")}
        description={t("recruiter.editJob.description")}
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
        submitLabel={t("recruiter.editJob.submit")}
        onSubmit={async (payload) => {
          await updateJob(job.id, payload);
          router.push(`/recruiter/jobs/${job.id}`);
        }}
      />
    </>
  );
}
