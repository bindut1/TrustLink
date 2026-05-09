import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";

export function CtaBanner() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 sm:px-6 pb-24 sm:pb-32">
      <Reveal>
        <div className="rounded-[28px] border border-border bg-canvas px-8 sm:px-14 py-16 sm:py-24">
          <div className="max-w-[760px] mx-auto text-center">
            <h2 className="text-[42px] sm:text-[56px] lg:text-[64px] font-bold tracking-[-0.032em] leading-[1.04] text-fg mb-6">
              Ready to upgrade hiring with{" "}
              <span className="text-accent">verifiable trust</span>?
            </h2>
            <p className="text-[19px] sm:text-[21px] text-fg-muted leading-[1.6] mb-10 max-w-[58ch] mx-auto">
              Join the network where credentials carry the proof — and matches
              are made on real signal.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register">
                <Button size="lg" rightIcon={<ArrowRight size={16} />}>
                  Create your free account
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="secondary">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
