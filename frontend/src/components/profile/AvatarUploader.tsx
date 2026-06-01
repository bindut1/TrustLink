"use client";

import { Camera, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ApiError } from "@/lib/api";
import { updateStoredUser } from "@/lib/auth-storage";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useCurrentUser } from "@/lib/use-current-user";
import { deleteAvatar, uploadAvatar } from "@/lib/users-api";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Avatar picker for the profile pages. Reads the current user from storage so
 * it stays in sync with the app shell — on a successful upload/remove it writes
 * back through `updateStoredUser`, which re-renders the topbar avatar too.
 */
export function AvatarUploader() {
  const { t } = useLanguage();
  const { user } = useCurrentUser();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  async function pickFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (!ACCEPT.includes(file.type)) {
      setError(t("avatar.errorType"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t("avatar.errorSize"));
      return;
    }

    setBusy(true);
    try {
      const updated = await uploadAvatar(file);
      updateStoredUser({ avatarUrl: updated.avatarUrl });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("avatar.errorUpload"));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    setError(null);
    setBusy(true);
    try {
      const updated = await deleteAvatar();
      updateStoredUser({ avatarUrl: updated.avatarUrl });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("avatar.errorUpload"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-canvas p-5 sm:p-6">
      <div className="text-[11.5px] uppercase tracking-[0.10em] font-semibold text-fg-subtle mb-5">
        {t("avatar.section")}
      </div>

      <div className="flex items-center gap-5">
        <div className="relative">
          <Avatar name={user.fullName} src={user.avatarUrl} size={88} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            title={t("avatar.change")}
            aria-label={t("avatar.change")}
            className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-canvas bg-accent text-[#0A0E1A] shadow-sm transition-[filter] hover:brightness-110 disabled:opacity-60"
          >
            <Camera size={15} />
          </button>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface-1 px-3.5 text-[14px] font-medium text-fg hover:border-border-strong hover:bg-surface-2 transition-colors disabled:opacity-60"
            >
              <Camera size={15} />
              {busy ? t("avatar.uploading") : t("avatar.change")}
            </button>
            {user.avatarUrl && (
              <button
                type="button"
                onClick={() => void remove()}
                disabled={busy}
                className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-[14px] font-medium text-danger hover:bg-danger/10 transition-colors disabled:opacity-60"
              >
                <Trash2 size={15} />
                {t("avatar.remove")}
              </button>
            )}
          </div>
          <p className="mt-2 text-[12.5px] text-fg-subtle">{t("avatar.hint")}</p>
          {error && <p className="mt-1.5 text-[12.5px] text-danger">{error}</p>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(",")}
        onChange={(e) => void pickFile(e.target.files?.[0])}
        className="hidden"
      />
    </section>
  );
}
