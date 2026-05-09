import { Reveal } from "@/components/motion/Reveal";
import { STATS } from "./landing-config";

export function Stats() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 sm:px-6 py-24 sm:py-32">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10 sm:gap-12">
        {STATS.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 100}>
            <div className="text-center sm:text-left">
              <div className="text-[60px] sm:text-[76px] font-bold tracking-[-0.04em] leading-none text-fg mb-4">
                {stat.value}
              </div>
              <div className="text-[16px] text-fg-muted leading-snug max-w-[26ch]">
                {stat.label}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
