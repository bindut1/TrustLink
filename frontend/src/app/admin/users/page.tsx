"use client";

import { Search, ShieldOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { UserActionsModal } from "@/components/admin/UserActionsModal";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/Table";
import { fetchUsers, updateUserStatus } from "@/lib/admin-api";
import type { AccountStatus, AdminUser } from "@/types/admin";

const STATUS_VARIANT: Record<AccountStatus, BadgeVariant> = {
  active: "success",
  suspended: "danger",
  inactive: "neutral",
  pending_verification: "warn",
};

const STATUS_LABEL: Record<AccountStatus, string> = {
  active: "Active",
  suspended: "Suspended",
  inactive: "Inactive",
  pending_verification: "Pending verification",
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [overrideTarget, setOverrideTarget] = useState<AdminUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    setUsers(null);
    fetchUsers({ search, role, status }).then((r) => {
      if (!cancelled) setUsers(r);
    });
    return () => {
      cancelled = true;
    };
  }, [search, role, status]);

  async function toggleSuspended(u: AdminUser) {
    const next = u.status === "suspended" ? "active" : "suspended";
    setSavingId(u.id);
    try {
      await updateUserStatus(u.id, next);
      setUsers((prev) =>
        prev ? prev.map((x) => (x.id === u.id ? { ...x, status: next } : x)) : prev,
      );
    } finally {
      setSavingId(null);
    }
  }

  const summary = useMemo(() => {
    if (!users) return "";
    return `${users.length} ${users.length === 1 ? "user" : "users"}`;
  }, [users]);

  return (
    <>
      <PageHeader
        title="Users"
        description="Search, filter, suspend and manage per-user action overrides."
      />

      <div className="rounded-2xl border border-border bg-canvas p-4 sm:p-5 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none"
          />
          <Input
            type="search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <Select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-11 sm:w-[180px]"
        >
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="issuer">Issuer</option>
          <option value="candidate">Candidate</option>
          <option value="recruiter">Recruiter</option>
        </Select>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-11 sm:w-[200px]"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending_verification">Pending verification</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      <div className="text-[12.5px] text-fg-subtle mb-3">{summary}</div>

      <Table>
        <THead>
          <TR>
            <TH>User</TH>
            <TH>Role</TH>
            <TH>Status</TH>
            <TH>Last login</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <TBody>
          {!users ? (
            <TR>
              <TD colSpan={5} className="text-center text-fg-subtle py-10">
                Loading users…
              </TD>
            </TR>
          ) : users.length === 0 ? (
            <TR>
              <TD colSpan={5} className="text-center text-fg-subtle py-10">
                No users match these filters.
              </TD>
            </TR>
          ) : (
            users.map((u) => (
              <TR key={u.id}>
                <TD>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent text-[12px] font-semibold">
                      {initials(u.fullName)}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold text-fg truncate">
                        {u.fullName}
                      </div>
                      <div className="text-[12.5px] text-fg-subtle font-mono truncate">
                        {u.email}
                      </div>
                    </div>
                  </div>
                </TD>
                <TD className="capitalize text-fg-muted">{u.role}</TD>
                <TD>
                  <Badge variant={STATUS_VARIANT[u.status]}>
                    {STATUS_LABEL[u.status]}
                  </Badge>
                </TD>
                <TD className="font-mono text-[12.5px] text-fg-subtle">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "—"}
                </TD>
                <TD>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="md"
                      leftIcon={<ShieldOff size={14} />}
                      onClick={() => setOverrideTarget(u)}
                    >
                      Overrides
                    </Button>
                    <Button
                      variant={u.status === "suspended" ? "primary" : "secondary"}
                      size="md"
                      loading={savingId === u.id}
                      onClick={() => toggleSuspended(u)}
                    >
                      {u.status === "suspended" ? "Unblock" : "Block"}
                    </Button>
                  </div>
                </TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>

      {overrideTarget && (
        <UserActionsModal
          user={overrideTarget}
          open
          onClose={() => setOverrideTarget(null)}
        />
      )}
    </>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
