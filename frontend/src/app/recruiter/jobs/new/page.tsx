"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { JobForm } from "@/components/recruiter/JobForm";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { createJob } from "@/lib/recruiter-api";

export default function NewJobPage() {
  const router = useRouter();
  const { t } = useLanguage();
  return (
    <>
      <PageHeader
        title={t("recruiter.newJob.title")}
        description={t("recruiter.newJob.description")}
      />
      <JobForm
        submitLabel={t("recruiter.newJob.submit")}
        onSubmit={async (payload) => {
          const job = await createJob(payload);
          router.push(`/recruiter/jobs/${job.id}`);
        }}
      />
    </>
  );
}
