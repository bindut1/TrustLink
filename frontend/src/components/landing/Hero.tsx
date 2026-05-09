import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { HERO_IMAGE } from "./landing-config";

export function Hero() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6 pt-20 sm:pt-28 lg:pt-32 pb-20 sm:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <div className="lg:col-span-6">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-[13px] uppercase tracking-[0.14em] font-semibold text-accent mb-7">
              <span
                className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-glow"
                aria-hidden
              />
              Verifiable Credentials Platform
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="text-[52px] sm:text-[72px] lg:text-[88px] font-bold tracking-[-0.038em] leading-[1.0] text-fg mb-8">
              Hire on what&apos;s been{" "}
              <span className="relative inline-block text-accent">
                verified
                <span
                  aria-hidden
                  className="absolute inset-x-0 -bottom-1 h-[12px] bg-gradient-to-r from-accent/0 via-accent/30 to-accent/0 blur-md"
                />
              </span>
              ,
              <br className="hidden sm:inline" /> not just claimed.
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="text-[20px] sm:text-[22px] text-fg-muted leading-[1.55] max-w-[56ch] mb-10">
              TrustLink anchors credentials on-chain so recruiters see the
              truth, candidates own their record, and institutions issue with
              confidence.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link href="/register">
                <Button size="lg" rightIcon={<ArrowRight size={16} />}>
                  Get started — it&apos;s free
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button size="lg" variant="secondary">
                  See how it works
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>

        <Reveal delay={120} from="right" className="lg:col-span-6">
          <div className="relative">
            {/* Soft accent halo behind image */}
            <div
              aria-hidden
              className="absolute -inset-6 sm:-inset-10 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_60%_40%,rgba(37,201,208,0.18),transparent_70%)]"
            />

            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-border bg-surface-2 shadow-[0_30px_60px_-20px_rgba(15,23,42,0.20),0_0_0_1px_rgba(15,23,42,0.04)] group">
              <Image
                src={HERO_IMAGE.src}
                alt={HERO_IMAGE.alt}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.02]"
              />
            </div>

            {/* Floating "verified" pill */}
            <div className="hidden sm:flex absolute -bottom-5 -left-5 items-center gap-3 rounded-2xl bg-canvas border border-border px-5 py-4 shadow-[0_16px_32px_-12px_rgba(15,23,42,0.20),0_0_0_1px_rgba(37,201,208,0.06)] animate-float">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <ShieldCheckIcon />
              </span>
              <div className="leading-tight">
                <div className="text-[15px] font-semibold text-fg">
                  MSc Computer Science
                </div>
                <div className="text-[12.5px] text-fg-subtle font-mono">
                  ✓ Verified · 0x4a8f…b21c
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ShieldCheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
