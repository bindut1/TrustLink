"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { SkillTag } from "@/components/ui/SkillTag";
import { ApiError } from "@/lib/api";
import { addMySkill, removeMySkill } from "@/lib/candidate-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { fetchSkillCatalog } from "@/lib/skills-api";
import type { CandidateSkill } from "@/types/candidate";
import type { SkillCatalogItem } from "@/types/issuer";

type Props = {
  skills: CandidateSkill[];
  onChange: (next: CandidateSkill[]) => void;
};

/**
 * Manage the candidate's skills. Pick a skill from the dropdown to add it
 * (stored self-declared, unverified); click the ✕ to remove any skill that is
 * NOT verified on-chain. Verified skills (teal) are managed by the issuer and
 * read-only. A self-declared skill auto-upgrades to verified once a matching
 * credential is anchored on-chain, and reverts to removable if it is revoked.
 */
export function SkillsEditor({ skills, onChange }: Props) {
  const { t } = useLanguage();
  const [catalog, setCatalog] = useState<SkillCatalogItem[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSkillCatalog()
      .then(setCatalog)
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const have = useMemo(
    () => new Set(skills.map((s) => s.skillName.trim().toLowerCase())),
    [skills],
  );

  // Catalog items not already on the profile, filtered by the query.
  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog
      .filter((c) => !have.has(c.normalized))
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.normalized.includes(q) ||
          c.aliases.some((a) => a.toLowerCase().includes(q)),
      )
      .slice(0, 50);
  }, [catalog, query, have]);

  async function add(item: SkillCatalogItem) {
    if (busy || have.has(item.normalized)) return;
    setBusy(true);
    setErr(null);
    try {
      const created = await addMySkill({ skillName: item.name });
      onChange([...skills, created]);
      setQuery("");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setErr(null);
    const prev = skills;
    onChange(skills.filter((s) => s.id !== id)); // optimistic
    try {
      await removeMySkill(id);
    } catch (e) {
      onChange(prev); // rollback
      setErr(e instanceof ApiError ? e.message : String(e));
    }
  }

  return (
    <div>
      <p className="text-[12.5px] text-fg-subtle mb-3">
        {t("candidate.profile.skillsManageHint")}
      </p>

      {skills.length === 0 ? (
        <p className="text-[12.5px] text-fg-faint mb-3">
          {t("candidate.profile.skillsEmpty")}
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {skills.map((s) => {
            // Removable = not verified on-chain (self-declared, pending, or a
            // leftover from a revoked credential). Verified skills are
            // issuer-managed and read-only.
            const removable = !s.isVerified;
            return (
              <SkillTag key={s.id} verified={s.isVerified}>
                {s.skillName}
                {removable && (
                  <button
                    type="button"
                    aria-label={t("candidate.profile.skillRemove")}
                    onClick={() => void remove(s.id)}
                    className="ml-0.5 rounded p-0.5 text-fg-faint transition-colors hover:text-danger"
                  >
                    <X size={12} />
                  </button>
                )}
              </SkillTag>
            );
          })}
        </div>
      )}

      {err && (
        <div className="mb-3">
          <Alert variant="error">{err}</Alert>
        </div>
      )}

      <div ref={boxRef} className="relative max-w-md">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={t("candidate.profile.skillAddPlaceholder")}
          className="h-11"
          disabled={busy}
        />
        {open && (
          <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto overflow-x-hidden rounded-lg border border-border bg-canvas py-1 shadow-[var(--shadow-card)]">
            {options.length === 0 ? (
              <li className="px-3 py-2 text-[12.5px] text-fg-faint">
                {t("candidate.profile.skillNoMatch")}
              </li>
            ) : (
              options.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => void add(c)}
                    disabled={busy}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] text-fg transition-colors hover:bg-surface-2 disabled:opacity-55"
                  >
                    <span>{c.name}</span>
                    {c.category && (
                      <span className="text-[11px] text-fg-faint">
                        {c.category}
                      </span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
