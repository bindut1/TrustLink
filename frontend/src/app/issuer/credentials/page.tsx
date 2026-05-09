"use client";

import { Ban, ExternalLink, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { RevokeModal } from "@/components/issuer/RevokeModal";
import { CredentialStatusBadge } from "@/components/issuer/StatusBadge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/Table";
import { ApiError } from "@/lib/api";
import {
  fetchCredentials,
  fetchCredentialTypes,
  fetchMyInstitution,
} from "@/lib/issuer-api";
import type { Credential, CredentialType, Institution } from "@/types/issuer";

export default function IssuerCredentialsPage() {
  const [inst, setInst] = useState<Institution | null>(null);
  const [types, setTypes] = useState<CredentialType[] | null>(null);
  const [items, setItems] = useState<Credential[] | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [revokeTarget, setRevokeTarget] = useState<Credential | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Resolve institution + types in parallel; everything else needs institutionId
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMyInstitution(), fetchCredentialTypes()])
      .then(([i, t]) => {
        if (cancelled) return;
        setInst(i);
        setTypes(t);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(
          e instanceof ApiError
            ? e.status === 404
              ? "Register your institution first to start issuing credentials."
              : e.message
            : "Failed to load",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
        setError(e instanceof Error ? e.message : "Failed to load credentials");
      });
    return () => {
      cancelled = true;
    };
  }, [inst, status]);

  const typeName = useMemo(() => {
    const map = new Map<string, string>();
    types?.forEach((t) => map.set(t.id, t.name));
    return (id: string) => map.get(id) ?? "—";
  }, [types]);

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

  return (
    <>
      <PageHeader
        title="My credentials"
        description="Every credential your institution has issued. Revoke any time — the on-chain record is updated automatically."
      />

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="rounded-2xl border border-border bg-canvas p-4 sm:p-5 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none"
          />
          <Input
            type="search"
            placeholder="Search by title or credential number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-11 sm:w-[200px]"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="issued">Issued</option>
          <option value="revoked">Revoked</option>
          <option value="reissued">Reissued</option>
        </Select>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Credential</TH>
            <TH>Type</TH>
            <TH>Status</TH>
            <TH>Tx hash</TH>
            <TH>Issued</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <TBody>
          {!filtered ? (
            <TR>
              <TD colSpan={6} className="text-center text-fg-subtle py-10">
                Loading credentials…
              </TD>
            </TR>
          ) : filtered.length === 0 ? (
            <TR>
              <TD colSpan={6} className="text-center text-fg-subtle py-10">
                No credentials match this view.
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
                <TD className="text-fg-muted">{typeName(c.credentialTypeId)}</TD>
                <TD>
                  <CredentialStatusBadge status={c.status} />
                  {c.status === "revoked" && c.revocationReason && (
                    <div
                      className="text-[11.5px] text-fg-subtle mt-1 line-clamp-1 max-w-[260px]"
                      title={c.revocationReason}
                    >
                      {c.revocationReason}
                    </div>
                  )}
                </TD>
                <TD>
                  {c.blockchainTxHash ? (
                    <a
                      href={`https://amoy.polygonscan.com/tx/${c.blockchainTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[12px] font-mono text-fg-muted hover:text-accent transition-colors"
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
                      Revoke
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
    </>
  );
}

function shortHash(h: string): string {
  return `${h.slice(0, 8)}…${h.slice(-6)}`;
}
