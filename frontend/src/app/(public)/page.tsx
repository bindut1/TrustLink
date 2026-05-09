import { CtaBanner } from "@/components/landing/CtaBanner";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ROLE_SECTIONS } from "@/components/landing/landing-config";
import { RoleSection } from "@/components/landing/RoleSection";
import { Stats } from "@/components/landing/Stats";
import { TrustedBy } from "@/components/landing/TrustedBy";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustedBy />

      {ROLE_SECTIONS.map((section, i) => (
        <RoleSection
          key={section.key}
          content={section}
          reverse={i % 2 === 1}
        />
      ))}

      <HowItWorks />
      <Stats />
      <CtaBanner />
    </>
  );
}
