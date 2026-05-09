"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api";
import { applyToJob } from "@/lib/candidate-api";
import type { JobItem } from "@/types/candidate";

type ApplyModalProps = {
  job: JobItem | null;
  onClose: () => void;
  onApplied: () => void;
};

export function ApplyModal({ job, onClose, onApplied }: ApplyModalProps) {
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!job) return;
    setSubmitting(true);
    setError(null);
    try {
      await applyToJob({
        jobId: job.id,
        coverLetter: coverLetter.trim() || undefined,
      });
      onApplied();
      setCoverLetter("");
      onClose();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.status === 409
            ? "You've already applied to this job."
            : e.message
          : "Application failed",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!job) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Apply to "${job.title}"?`}
      description="Your verified credentials and skills are used to compute a match score that the recruiter will see."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={submitting}>
            Submit application
          </Button>
        </>
      }
    >
      {error && (
        <Alert variant="error" className="mb-3">
          {error}
        </Alert>
      )}
      <label className="text-[14px] font-medium text-fg mb-2 block">
        Cover letter <span className="text-fg-faint font-normal">· optional</span>
      </label>
      <textarea
        value={coverLetter}
        onChange={(e) => setCoverLetter(e.target.value)}
        rows={6}
        placeholder="Why are you a good fit? Mention experience that's not in your credentials."
        className="w-full rounded-lg border border-border bg-surface-1 p-3 text-[14px] text-fg placeholder:text-fg-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-colors resize-y"
      />
    </Modal>
  );
}
