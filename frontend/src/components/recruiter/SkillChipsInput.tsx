"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type SkillChipsInputProps = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
};

export function SkillChipsInput({
  value,
  onChange,
  placeholder,
}: SkillChipsInputProps) {
  const [draft, setDraft] = useState("");

  function add() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
  }

  function remove(skill: string) {
    onChange(value.filter((s) => s !== skill));
  }

  return (
    <>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder ?? "Type a skill and press Enter…"}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={add}
          disabled={!draft.trim()}
        >
          Add
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {value.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => remove(s)}
              className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/60 pl-3 pr-2 py-1 text-[13px] text-fg-muted hover:border-danger/40 hover:text-danger transition-colors"
            >
              {s}
              <X
                size={12}
                className="text-fg-faint group-hover:text-danger"
              />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
