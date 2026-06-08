"use client";

import { SkillCatalogPicker } from "@/components/ui/SkillCatalogPicker";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type SkillChipsInputProps = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
};

/** Recruiter skills input, backed by the canonical skill catalog. */
export function SkillChipsInput({
  value,
  onChange,
  placeholder,
}: SkillChipsInputProps) {
  const { t } = useLanguage();
  return (
    <SkillCatalogPicker
      value={value}
      onChange={onChange}
      placeholder={placeholder ?? t("skillChips.placeholder")}
    />
  );
}
