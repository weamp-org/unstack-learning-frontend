import type { Metadata } from "next";

import { ClosingCtaSection } from "@/components/closing-cta";
import { HeroSection } from "@/components/hero-section";
import { HowItWorksSection } from "@/components/how-it-works";
import { SupportedSubjectsSection } from "@/components/supported-subjects";

export const metadata: Metadata = {
  title: "Unstack Learning — Free one-on-one academic help",
  description:
    "Stuck on a subject? Pick it, describe the problem, and a teacher will meet you live to work through it. Free, one-on-one, and online.",
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <SupportedSubjectsSection />
      <HowItWorksSection />
      <ClosingCtaSection />
    </>
  );
}
