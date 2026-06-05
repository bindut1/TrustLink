"use client";

import { useEffect, useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { fetchPublicStats, type PublicStats } from "@/lib/public-api";
import { STATS } from "./landing-config";

export function Stats() {
  const { t, lang } = useLanguage();
  const [data, setData] = useState<PublicStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPublicStats()
      .then((d) => !cancelled && setData(d))
      .catch(() => {
        /* keep placeholders if the public stats call fails */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat(lang).format(n);

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6 py-16 sm:py-20">
        <Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-12">
            {STATS.map((stat) => (
              <div
                key={stat.key}
                className={cn(
                  "px-2 sm:px-6 text-center",
                  // subtle vertical hairlines between columns on desktop only
                  "lg:border-l lg:border-border lg:first:border-l-0",
                )}
              >
                <div className="text-[60px] sm:text-[80px] font-extrabold tracking-[-0.04em] leading-none text-fg tabular-nums">
                  {data ? fmt(data[stat.key]) : <span className="text-fg-faint">—</span>}
                </div>
                <div className="mt-4 text-[14px] sm:text-[15px] font-semibold uppercase tracking-[0.04em] text-fg-subtle leading-snug max-w-[24ch] mx-auto">
                  {t(stat.labelKey)}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
