"use client";

import { Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { BatchProgress } from "@/components/issuer/BatchProgress";
import { BatchStatusBadge } from "@/components/issuer/StatusBadge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Input";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/Table";
import { cn } from "@/lib/cn";
import {
  fetchCredentialTypes,
  fetchMyBatches,
  uploadBatchExcel,
} from "@/lib/issuer-api";
import type { BatchImport, CredentialType } from "@/types/issuer";

export default function BatchImportPage() {
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
      setError("Only .xlsx or .xls files are accepted.");
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
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Batch import"
        description="Upload an Excel file to issue credentials in bulk. Each row becomes one credential — invalid rows are reported back so you can fix and re-upload."
      />

      <div className="rounded-2xl border border-border bg-canvas p-5 sm:p-6 mb-6">
        <div className="text-[11.5px] uppercase tracking-[0.10em] font-semibold text-fg-subtle mb-5">
          New upload
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 mb-4 items-end">
          <FormField label="Credential type" required>
            {!types ? (
              <Select disabled>
                <option>Loading types…</option>
              </Select>
            ) : (
              <Select
                value={typeId}
                onChange={(e) => setTypeId(e.target.value)}
              >
                <option value="">Select credential type…</option>
                {types
                  .filter((t) => t.isActive)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </Select>
            )}
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
            "block rounded-xl border-2 border-dashed px-5 py-10 text-center cursor-pointer transition-colors",
            dragOver
              ? "border-accent bg-accent/5"
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
                {(file.size / 1024).toFixed(1)} KB · ready to upload
              </div>
            </>
          ) : (
            <>
              <div className="text-[14.5px] font-medium text-fg">
                Drop Excel file here, or click to browse
              </div>
              <div className="text-[12.5px] text-fg-subtle mt-1">
                .xlsx or .xls — first row should match the credential type schema
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
              Remove file
            </Button>
          )}
          <Button
            type="button"
            onClick={upload}
            loading={uploading}
            disabled={!file || !typeId}
            leftIcon={<Upload size={14} />}
          >
            Upload &amp; queue
          </Button>
        </div>
      </div>

      {activeBatchId && (
        <div className="mb-7">
          <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-fg mb-3">
            Current batch
          </h2>
          <BatchProgress
            batchId={activeBatchId}
            onUpdate={() => void refreshHistory()}
          />
        </div>
      )}

      <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-fg mb-3">
        Batch history
      </h2>
      {!history ? (
        <div className="rounded-2xl border border-border bg-canvas p-10 text-center text-fg-subtle">
          Loading…
        </div>
      ) : history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-canvas p-10 text-center text-fg-subtle">
          No batch imports yet.
        </div>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>File</TH>
              <TH>Status</TH>
              <TH className="text-right">Total</TH>
              <TH className="text-right">Success</TH>
              <TH className="text-right">Errors</TH>
              <TH>Created</TH>
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
                    className="text-[13px] font-medium text-accent hover:underline"
                  >
                    View
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
