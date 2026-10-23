import { HeroSection } from "@/components/hero-section";
import { HowItWorksSection } from "@/components/how-it-works";
import { SupportedSubjectsSection } from "@/components/supported-subjects";

export default function Home() {
  return (
    <>
      <HeroSection />
      <SupportedSubjectsSection />
      <HowItWorksSection />
    </>
  );
}
