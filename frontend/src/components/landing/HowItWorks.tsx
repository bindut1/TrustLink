"use client";

import { Reveal } from "@/components/motion/Reveal";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { HOW_IT_WORKS } from "./landing-config";

export function HowItWorks() {
  const { t } = useLanguage();
  return (
    <section className="relative border-y border-border/70 bg-surface-2/40">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(11,27,58,0.07),transparent_60%)]"
      />
      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-6 py-24 sm:py-32">
        <div className="max-w-[760px] mb-16 sm:mb-20">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-[14px] uppercase tracking-[0.14em] font-semibold text-[#25C9D0] mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-[#25C9D0]" aria-hidden />
              {t("landing.how.eyebrow")}
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="text-[40px] sm:text-[56px] font-black tracking-[-0.032em] leading-[1.06] text-fg mb-6">
              {t("landing.how.title")}
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="text-[20px] text-fg-muted leading-[1.6] max-w-[60ch]">
              {t("landing.how.description")}
            </p>
          </Reveal>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-7">
          {HOW_IT_WORKS.map((step, i) => (
            <Reveal key={step.step} as="li" delay={i * 120}>
              <div className="relative h-full rounded-card border border-border bg-canvas p-7 sm:p-8 transition-all duration-300 hover:border-border-strong hover:-translate-y-1 hover:shadow-[0_20px_40px_-16px_rgba(11,27,58,0.18)]">
                {i < HOW_IT_WORKS.length - 1 && (
                  <span
                    aria-hidden
                    className="hidden md:block absolute top-1/2 -right-3.5 h-px w-7 bg-gradient-to-r from-border-strong to-transparent"
                  />
                )}
                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-[13px] font-mono font-semibold uppercase tracking-[0.12em] text-[#25C9D0]">
                    {step.step}
                  </span>
                  <span className="h-px flex-1 bg-border" aria-hidden />
                </div>
                <h3 className="text-[22px] sm:text-[24px] font-bold tracking-[-0.022em] text-fg mb-3 leading-[1.25]">
                  {t(step.titleKey)}
                </h3>
                <p className="text-[16.5px] text-fg-muted leading-[1.6]">
                  {t(step.descriptionKey)}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
