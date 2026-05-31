"use client";

import { Reveal } from "@/components/motion/Reveal";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { TRUSTED_BY } from "./landing-config";

export function TrustedBy() {
  const { t } = useLanguage();
  return (
    <section className="border-y border-border/70 bg-surface-2/50 backdrop-blur-sm">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6 py-12 sm:py-14">
        <Reveal>
          <p className="text-center text-[13px] uppercase tracking-[0.14em] font-semibold text-fg-subtle mb-9">
            {t("landing.trustedBy.title")}
          </p>
        </Reveal>
        <Reveal delay={120}>
          <div className="flex flex-wrap items-center justify-center gap-x-14 sm:gap-x-20 gap-y-6">
            {TRUSTED_BY.map((name) => (
              <span
                key={name}
                className="text-[18px] sm:text-[20px] font-semibold tracking-tight text-fg-subtle hover:text-fg transition-colors duration-300"
              >
                {name}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
