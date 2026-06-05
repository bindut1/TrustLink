"use client";

import { Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSetPageMeta } from "@/components/app-shell/page-meta";
import { BatchProgress } from "@/components/issuer/BatchProgress";
import { BatchStatusBadge } from "@/components/issuer/StatusBadge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField } from "@/components/ui/FormField";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/Table";
import { cn } from "@/lib/cn";
import {
  fetchCredentialTypes,
  fetchMyBatches,
  uploadBatchExcel,
} from "@/lib/issuer-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { BatchImport, CredentialType } from "@/types/issuer";

export default function BatchImportPage() {
  const { t } = useLanguage();
  useSetPageMeta(t("issuer.batch.title"), t("issuer.batch.description"));
  const [types, setTypes] = useState<CredentialType[] | null>(null);
  const [typeId, setTypeId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [history, setHistory] = useState<BatchImport[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCredentialTypes().then(setTypes);
    void refreshHistory();
  }, []);

  async function refreshHistory() {
    const list = await fetchMyBatches();
    setHistory(list);
  }

  function pickFile(f: File | null | undefined) {
    if (!f) return;
    if (
      !f.name.toLowerCase().endsWith(".xlsx") &&
      !f.name.toLowerCase().endsWith(".xls")
    ) {
      setError(t("issuer.batch.invalidFile"));
      return;
    }
    setError(null);
    setFile(f);
  }

  async function upload() {
    if (!file || !typeId) return;
    setUploading(true);
    setError(null);
    try {
      const batch = await uploadBatchExcel(typeId, file);
      setActiveBatchId(batch.id);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      void refreshHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("issuer.batch.uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  const typeOptions = [
    { value: "", label: t("issuer.batch.selectType") },
    ...(types ?? [])
      .filter((ct) => ct.isActive)
      .map((ct) => ({ value: ct.id, label: ct.name })),
  ];

  return (
    <>
      <div className="rounded-card border border-border bg-canvas p-5 sm:p-6 mb-6 shadow-[var(--shadow-card)]">
        <div className="text-[11.5px] uppercase tracking-[0.10em] font-semibold text-fg-subtle mb-5">
          {t("issuer.batch.newUpload")}
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 mb-4 items-end">
          <FormField label={t("issuer.batch.credentialType")} required>
            <SelectMenu
              value={typeId}
              onChange={setTypeId}
              options={typeOptions}
              ariaLabel={t("issuer.batch.credentialType")}
              placeholder={
                !types ? t("issuer.batch.loadingTypes") : t("issuer.batch.selectType")
              }
            />
          </FormField>
        </div>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            pickFile(e.dataTransfer.files[0]);
          }}
          className={cn(
            "block rounded-xl border-2 border-dashed px-5 py-10 text-center cursor-pointer transition-colors duration-150",
            dragOver
              ? "border-navy bg-navy/5"
              : "border-border bg-surface-2/40 hover:border-border-strong",
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => pickFile(e.target.files?.[0])}
            className="hidden"
          />
          <Upload size={28} className="mx-auto text-fg-subtle mb-3" />
          {file ? (
            <>
              <div className="text-[14.5px] font-semibold text-fg">
                {file.name}
              </div>
              <div className="text-[12.5px] text-fg-subtle font-mono mt-1">
                {t("issuer.batch.readyToUpload").replace(
                  "{size}",
                  (file.size / 1024).toFixed(1),
                )}
              </div>
            </>
          ) : (
            <>
              <div className="text-[14.5px] font-medium text-fg">
                {t("issuer.batch.dropFile")}
              </div>
              <div className="text-[12.5px] text-fg-subtle mt-1">
                {t("issuer.batch.fileNote")}
              </div>
            </>
          )}
        </label>

        <div className="flex items-center justify-end gap-3 mt-5">
          {file && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              {t("issuer.batch.removeFile")}
            </Button>
          )}
          <Button
            type="button"
            onClick={upload}
            loading={uploading}
            disabled={!file || !typeId}
            leftIcon={<Upload size={14} />}
          >
            {t("issuer.batch.uploadQueue")}
          </Button>
        </div>
      </div>

      {activeBatchId && (
        <div className="mb-7">
          <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-fg mb-3">
            {t("issuer.batch.currentBatch")}
          </h2>
          <BatchProgress
            batchId={activeBatchId}
            onUpdate={() => void refreshHistory()}
          />
        </div>
      )}

      <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-fg mb-3">
        {t("issuer.batch.history")}
      </h2>
      {!history ? (
        <div className="rounded-card border border-border bg-canvas p-10 text-center text-fg-subtle shadow-[var(--shadow-card)]">
          {t("common.loading")}
        </div>
      ) : history.length === 0 ? (
        <EmptyState icon={Upload} title={t("issuer.batch.emptyHistory")} />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>{t("issuer.batch.colFile")}</TH>
              <TH>{t("common.status")}</TH>
              <TH className="text-right">{t("issuer.batch.colTotal")}</TH>
              <TH className="text-right">{t("issuer.batch.colSuccess")}</TH>
              <TH className="text-right">{t("issuer.batch.colErrors")}</TH>
              <TH>{t("issuer.batch.colCreated")}</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {history.map((b) => (
              <TR key={b.id}>
                <TD className="text-fg font-medium truncate max-w-[260px]">
                  {b.originalFilename}
                </TD>
                <TD>
                  <BatchStatusBadge status={b.status} />
                </TD>
                <TD className="text-right font-mono text-fg-muted">
                  {b.totalRows}
                </TD>
                <TD className="text-right font-mono text-success">
                  {b.successCount}
                </TD>
                <TD className="text-right font-mono">
                  <span className={b.errorCount > 0 ? "text-danger" : "text-fg-subtle"}>
                    {b.errorCount}
                  </span>
                </TD>
                <TD className="font-mono text-[12px] text-fg-subtle">
                  {new Date(b.createdAt).toLocaleString()}
                </TD>
                <TD className="text-right">
                  <button
                    type="button"
                    onClick={() => setActiveBatchId(b.id)}
                    className="text-[13px] font-medium text-navy hover:underline"
                  >
                    {t("common.view")}
                  </button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
