"use client";

import { ArrowRight, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { RoleSectionContent } from "./landing-config";

type RoleSectionProps = {
  content: RoleSectionContent;
  /** alternates the image side on every other section */
  reverse?: boolean;
};

export function RoleSection({ content, reverse }: RoleSectionProps) {
  const { t } = useLanguage();
  return (
    <section className="mx-auto max-w-[1200px] px-5 sm:px-6 py-24 sm:py-32">
      <div
        className={cn(
          "grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center",
          reverse && "lg:[&>*:first-child]:order-2",
        )}
      >
        <div className="lg:col-span-6">
          <Reveal from={reverse ? "right" : "left"}>
            <span className="inline-flex items-center gap-2 text-[13px] uppercase tracking-[0.14em] font-semibold text-accent mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              {t(content.eyebrowKey)}
            </span>
          </Reveal>

          <Reveal from={reverse ? "right" : "left"} delay={80}>
            <h2 className="text-[40px] sm:text-[52px] lg:text-[56px] font-bold tracking-[-0.032em] leading-[1.06] text-fg mb-7 max-w-[20ch]">
              {t(content.titleKey)}
            </h2>
          </Reveal>

          <Reveal from={reverse ? "right" : "left"} delay={140}>
            <p className="text-[19px] sm:text-[20px] text-fg-muted leading-[1.6] max-w-[58ch] mb-9">
              {t(content.descriptionKey)}
            </p>
          </Reveal>

          <ul className="flex flex-col gap-4 mb-10">
            {content.bulletKeys.map((bulletKey, i) => (
              <Reveal key={bulletKey} as="li" delay={200 + i * 80}>
                <span className="flex items-start gap-3.5 text-[17.5px] text-fg leading-[1.55]">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-accent shrink-0">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <span>{t(bulletKey)}</span>
                </span>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={460}>
            <Link
              href={content.cta.href}
              className="group inline-flex items-center gap-1.5 text-[16.5px] font-semibold text-accent transition-all duration-300 hover:gap-3"
            >
              {t(content.cta.labelKey)}
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </Link>
          </Reveal>
        </div>

        <Reveal from={reverse ? "left" : "right"} delay={120} className="lg:col-span-6">
          <div className="relative group">
            <div
              aria-hidden
              className="absolute -inset-4 sm:-inset-8 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(37,201,208,0.10),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            />
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-border bg-surface-2 shadow-[0_24px_48px_-20px_rgba(15,23,42,0.18),0_0_0_1px_rgba(15,23,42,0.03)]">
              <Image
                src={content.image.src}
                alt={t(content.image.altKey)}
                fill
                loading="lazy"
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
