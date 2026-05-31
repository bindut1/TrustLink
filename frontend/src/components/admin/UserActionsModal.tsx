"use client";

import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  fetchActions,
  fetchUserOverrides,
  removeUserOverride,
  setUserOverride,
} from "@/lib/admin-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { AdminAction, AdminUser, UserActionOverride } from "@/types/admin";

type UserActionsModalProps = {
  user: AdminUser;
  open: boolean;
  onClose: () => void;
};

export function UserActionsModal({ user, open, onClose }: UserActionsModalProps) {
  const { t } = useLanguage();
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [overrides, setOverrides] = useState<UserActionOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchActions(), fetchUserOverrides(user.id)])
      .then(([acts, ovs]) => {
        if (cancelled) return;
        setActions(acts);
        setOverrides(ovs);
        setReasons(
          Object.fromEntries(ovs.map((o) => [o.actionId, o.reason ?? ""])),
        );
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : t("userActions.failedLoad"),
          );
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, user.id, t]);

  const isBlocked = (actionId: string) =>
    overrides.some((o) => o.actionId === actionId && !o.isEnabled);

  async function toggleBlock(action: AdminAction) {
    setSavingId(action.id);
    setError(null);
    try {
      if (isBlocked(action.id)) {
        await removeUserOverride(user.id, action.id);
        setOverrides((prev) => prev.filter((o) => o.actionId !== action.id));
      } else {
        const ov: UserActionOverride = {
          actionId: action.id,
          isEnabled: false,
          reason: reasons[action.id] || undefined,
        };
        await setUserOverride(user.id, ov);
        setOverrides((prev) => {
          const filtered = prev.filter((o) => o.actionId !== action.id);
          return [...filtered, ov];
        });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("userActions.failedSave"));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={t("userActions.title")}
      description={
        <>
          {t("userActions.description").split("[user]")[0]}
          <strong className="text-fg">{user.fullName}</strong>
          {t("userActions.description").split("[user]")[1] ?? ""}
        </>
      }
      footer={
        <Button variant="secondary" onClick={onClose}>
          {t("common.close")}
        </Button>
      }
    >
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="py-10 text-center text-[14px] text-fg-subtle">
          {t("userActions.loading")}
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {actions.map((a) => {
            const blocked = isBlocked(a.id);
            const saving = savingId === a.id;
            return (
              <li key={a.id} className="py-3.5 flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-fg">
                      {a.name}
                    </span>
                    <code className="text-[11px] font-mono text-fg-subtle">
                      {a.code}
                    </code>
                  </div>
                  {blocked && (
                    <input
                      type="text"
                      value={reasons[a.id] ?? ""}
                      onChange={(e) =>
                        setReasons((r) => ({ ...r, [a.id]: e.target.value }))
                      }
                      placeholder={t("userActions.reasonPlaceholder")}
                      className="mt-2 h-9 w-full rounded-md border border-border bg-surface-1 px-3 text-[13px] text-fg placeholder:text-fg-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-colors"
                    />
                  )}
                </div>
                <Button
                  variant={blocked ? "secondary" : "primary"}
                  size="md"
                  loading={saving}
                  onClick={() => toggleBlock(a)}
                >
                  {blocked ? t("admin.users.unblock") : t("admin.users.block")}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
