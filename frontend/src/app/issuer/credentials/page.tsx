"use client";

import { Ban, ExternalLink, FileX2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSetPageMeta } from "@/components/app-shell/page-meta";
import { RevokeModal } from "@/components/issuer/RevokeModal";
import { CredentialStatusPill } from "@/components/issuer/StatusBadge";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/Table";
import { ApiError } from "@/lib/api";
import { fetchCredentials, fetchMyInstitution } from "@/lib/issuer-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Credential, Institution } from "@/types/issuer";

export default function IssuerCredentialsPage() {
  const { t } = useLanguage();
  useSetPageMeta(
    t("issuer.credentials.title"),
    t("issuer.credentials.description"),
  );
  const [inst, setInst] = useState<Institution | null>(null);
  const [items, setItems] = useState<Credential[] | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [revokeTarget, setRevokeTarget] = useState<Credential | null>(null);
  const [reasonModal, setReasonModal] = useState<{ title: string; reason: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMyInstitution()
      .then((i) => {
        if (cancelled) return;
        setInst(i);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(
          e instanceof ApiError
            ? e.status === 404
              ? t("issuer.credentials.registerFirst")
              : e.message
            : t("issuer.credentials.failedLoad"),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    if (!inst) return;
    let cancelled = false;
    setItems(null);
    fetchCredentials({
      institutionId: inst.id,
      status: status !== "all" ? status : undefined,
    })
      .then((r) => {
        if (!cancelled) setItems(r);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : t("issuer.credentials.failedLoad"),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [inst, status]);

  const filtered = useMemo(() => {
    if (!items) return null;
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.credentialNumber.toLowerCase().includes(q),
    );
  }, [items, search]);

  function handleRevoked(id: string) {
    setItems((prev) =>
      prev
        ? prev.map((c) =>
            c.id === id
              ? { ...c, status: "revoked", revokedAt: new Date().toISOString() }
              : c,
          )
        : prev,
    );
  }

  const statusOptions = [
    { value: "all", label: t("status.cred.all") },
    { value: "pending", label: t("status.cred.pending") },
    { value: "issued", label: t("status.cred.issued") },
    { value: "revoked", label: t("status.cred.revoked") },
    { value: "reissued", label: t("status.cred.reissued") },
  ];

  return (
    <>
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="rounded-card border border-border bg-canvas p-4 sm:p-5 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none"
          />
          <Input
            type="search"
            placeholder={t("issuer.credentials.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <SelectMenu
          value={status}
          onChange={setStatus}
          options={statusOptions}
          ariaLabel={t("common.status")}
          className="sm:w-[200px]"
        />
        <Link href="/issuer/issue">
          <Button variant="verified" leftIcon={<Plus size={16} />} className="w-full sm:w-auto">
            {t("issuer.credentials.issueCta")}
          </Button>
        </Link>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>{t("issuer.credentials.colCredential")}</TH>
            <TH>{t("issuer.credentials.colCandidate")}</TH>
            <TH>{t("common.type")}</TH>
            <TH>{t("common.status")}</TH>
            <TH>{t("issuer.credentials.colTxHash")}</TH>
            <TH>{t("issuer.credentials.colIssued")}</TH>
            <TH className="text-right">{t("common.actions")}</TH>
          </TR>
        </THead>
        <TBody>
          {!filtered ? (
            <TR>
              <TD colSpan={7} className="text-center text-fg-subtle py-10">
                {t("issuer.credentials.loading")}
              </TD>
            </TR>
          ) : filtered.length === 0 ? (
            <TR>
              <TD colSpan={7} className="text-center text-fg-subtle py-10">
                {t("issuer.credentials.empty")}
              </TD>
            </TR>
          ) : (
            filtered.map((c) => (
              <TR key={c.id}>
                <TD>
                  <div className="text-[14px] font-semibold text-fg">
                    {c.title}
                  </div>
                  <div className="text-[12.5px] font-mono text-fg-subtle">
                    {c.credentialNumber}
                  </div>
                </TD>
                <TD>
                  {c.candidate ? (
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        name={c.candidate.fullName}
                        src={c.candidate.avatarUrl}
                        size={30}
                      />
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-medium text-fg truncate">
                          {c.candidate.fullName}
                        </div>
                        <div className="text-[11.5px] text-fg-subtle font-mono truncate">
                          {c.candidate.email}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-fg-faint">—</span>
                  )}
                </TD>
                <TD className="text-fg-muted">
                  {c.credentialType?.name ?? "—"}
                </TD>
                <TD>
                  {c.status === "revoked" && c.revocationReason ? (
                    <button
                      type="button"
                      onClick={() =>
                        setReasonModal({ title: c.title, reason: c.revocationReason! })
                      }
                      className="inline-flex w-fit hover:opacity-80 transition-opacity"
                      title={t("issuer.credentials.showReason")}
                    >
                      <CredentialStatusPill credential={c} />
                    </button>
                  ) : (
                    <CredentialStatusPill credential={c} />
                  )}
                </TD>
                <TD>
                  {c.blockchainTxHash ? (
                    <a
                      href={`https://amoy.polygonscan.com/tx/${c.blockchainTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[12px] font-mono text-fg-muted hover:text-navy transition-colors"
                    >
                      {shortHash(c.blockchainTxHash)}
                      <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span className="text-fg-faint">—</span>
                  )}
                </TD>
                <TD className="font-mono text-[12.5px] text-fg-subtle">
                  {new Date(c.issuedDate).toLocaleDateString()}
                </TD>
                <TD className="text-right">
                  {c.status === "issued" || c.status === "pending" ? (
                    <Button
                      variant="secondary"
                      size="md"
                      leftIcon={<Ban size={13} />}
                      onClick={() => setRevokeTarget(c)}
                    >
                      {t("issuer.credentials.revoke")}
                    </Button>
                  ) : (
                    <span className="text-fg-faint text-[12.5px]">—</span>
                  )}
                </TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>

      <RevokeModal
        credential={revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onRevoked={handleRevoked}
      />

      <Modal
        open={reasonModal !== null}
        onClose={() => setReasonModal(null)}
        title={t("issuer.credentials.reasonModalTitle")}
        footer={
          <Button variant="secondary" onClick={() => setReasonModal(null)}>
            {t("common.close")}
          </Button>
        }
      >
        {reasonModal && (
          <>
            <div className="flex items-start gap-3 rounded-xl border border-danger/25 bg-danger/[0.04] p-4">
              <span className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-danger/15 text-danger">
                <FileX2 size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.10em] text-danger/80 mb-1">
                  {t("issuer.credentials.reasonModalTitle")}
                </div>
                <div className="text-[15px] font-semibold text-fg leading-snug">
                  {reasonModal.reason}
                </div>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-[120px_1fr] gap-y-3 text-[13.5px]">
              <dt className="text-fg-subtle">{t("issuer.credentials.reasonLabel")}</dt>
              <dd className="text-fg font-medium">{reasonModal.title}</dd>
            </dl>
          </>
        )}
      </Modal>
    </>
  );
}

function shortHash(h: string): string {
  return `${h.slice(0, 8)}…${h.slice(-6)}`;
}
