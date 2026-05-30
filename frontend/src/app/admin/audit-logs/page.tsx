"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/Table";
import { fetchAuditLogs } from "@/lib/admin-api";
import type { AuditLog } from "@/types/admin";

const ENTITY_TYPES = [
  "user",
  "credential",
  "institution",
  "user_action_override",
];

const ACTION_PRESETS = [
  "auth.login",
  "credential.issue",
  "credential.revoke",
  "institution.approved",
  "institution.rejected",
  "user.status_change",
  "user.override_set",
  "user.override_removed",
];

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[] | null>(null);
  const [entityType, setEntityType] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [limit, setLimit] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  async function load() {
    setLoading(true);
    try {
      const data = await fetchAuditLogs({
        entityType: entityType || undefined,
        action: action || undefined,
        limit,
      });
      setLogs(data);
      setExpanded(new Set());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <PageHeader
        title="Audit logs"
        description="Track every privileged action across the system (latest first)."
      />

      <div className="rounded-2xl border border-border bg-canvas p-4 sm:p-5 mb-4 flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <Label className="mb-1.5">Action</Label>
          <Select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="h-11"
          >
            <option value="">All actions</option>
            {ACTION_PRESETS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex-1">
          <Label className="mb-1.5">Entity type</Label>
          <Select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="h-11"
          >
            <option value="">All entities</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:w-[120px]">
          <Label className="mb-1.5">Limit</Label>
          <Input
            type="number"
            min={10}
            max={500}
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value, 10) || 100)}
            className="h-11"
          />
        </div>
        <Button onClick={load} loading={loading} className="sm:w-auto">
          Apply
        </Button>
      </div>

      <div className="text-[12.5px] text-fg-subtle mb-3">
        {logs
          ? `${logs.length} ${logs.length === 1 ? "entry" : "entries"}`
          : ""}
      </div>

      <Table>
        <THead>
          <TR>
            <TH className="w-[40px]"></TH>
            <TH>When</TH>
            <TH>Actor</TH>
            <TH>Action</TH>
            <TH>Entity</TH>
          </TR>
        </THead>
        <TBody>
          {!logs ? (
            <TR>
              <TD colSpan={5} className="text-center text-fg-subtle py-10">
                Loading…
              </TD>
            </TR>
          ) : logs.length === 0 ? (
            <TR>
              <TD colSpan={5} className="text-center text-fg-subtle py-10">
                No audit logs match this filter.
              </TD>
            </TR>
          ) : (
            logs.map((log) => {
              const isExpanded = expanded.has(log.id);
              const hasChanges =
                (log.oldValues && Object.keys(log.oldValues).length > 0) ||
                (log.newValues && Object.keys(log.newValues).length > 0);
              return (
                <Fragment key={log.id}>
                  <TR
                    onClick={hasChanges ? () => toggleExpand(log.id) : undefined}
                    className={hasChanges ? "cursor-pointer" : ""}
                  >
                    <TD>
                      {hasChanges ? (
                        isExpanded ? (
                          <ChevronDown size={14} className="text-fg-subtle" />
                        ) : (
                          <ChevronRight size={14} className="text-fg-subtle" />
                        )
                      ) : null}
                    </TD>
                    <TD className="font-mono text-[12.5px] text-fg-subtle whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </TD>
                    <TD>
                      {log.user ? (
                        <div>
                          <div className="text-fg">{log.user.fullName}</div>
                          <div className="text-[12.5px] text-fg-subtle">
                            {log.user.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-fg-faint italic">System</span>
                      )}
                    </TD>
                    <TD>
                      <code className="text-[12.5px] font-mono text-fg-muted bg-surface-2 px-2 py-0.5 rounded">
                        {log.action}
                      </code>
                    </TD>
                    <TD>
                      <div className="text-fg-muted">{log.entityType}</div>
                      {log.entityId && (
                        <div className="text-[11.5px] font-mono text-fg-faint">
                          {log.entityId.slice(0, 8)}…
                        </div>
                      )}
                    </TD>
                  </TR>
                  {isExpanded && hasChanges && (
                    <TR
                      key={`${log.id}-detail`}
                      className="bg-surface-2/30 hover:bg-surface-2/30"
                    >
                      <TD></TD>
                      <TD colSpan={4}>
                        <pre className="text-[12px] font-mono text-fg-muted bg-canvas border border-border rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(
                            { old: log.oldValues, new: log.newValues },
                            null,
                            2,
                          )}
                        </pre>
                      </TD>
                    </TR>
                  )}
                </Fragment>
              );
            })
          )}
        </TBody>
      </Table>
    </>
  );
}
