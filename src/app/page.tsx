import { Hero } from "@/components/ui/helix-hero";
import { SecondaryHero } from "@/components/home/secondary-hero";
import { StatsSection } from "@/components/home/stats-section";
import { FeaturesSection } from "@/components/home/features-section";
import { PackagesSection } from "@/components/home/packages-section";
import { CTASection } from "@/components/home/cta-section";
import { ContactSection } from "@/components/home/contact-section";
import { Footer } from "@/components/home/footer";
import { Navbar } from "@/components/home/navbar";
import localFont from "next/font/local";

const satoshi = localFont({
  src: [
    { path: "../fonts/satoshi/Satoshi-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/satoshi/Satoshi-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/satoshi/Satoshi-700.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
});

export default function Home() {
  return (
    <main id="home" className={`home-navbar-offset homepage-bg ${satoshi.className}`}>
      <Navbar />

      <Hero
        title="AI Voice Dialer"
        description={[
          "Intelligent voice communication platform powered by advanced AI agents, built to operate at scale with high accuracy and reliability. Real-time speech recognition, natural language processing, and seamless call automation support enterprise-scale outbound campaigns.",
          "The platform enables natural, human-like conversations through adaptive dialogue handling, intent detection, and contextual understanding. It ensures consistent performance across large call volumes while maintaining clarity, responsiveness, and automation efficiency for enterprise communication workflows.",
        ]}
        adjustForNavbar
        stats={[
          { label: "Response Time", value: "<500ms" },
          { label: "Concurrent Calls", value: "1000+" },
          { label: "Completion Rate", value: "94%" },
        ]}
      />
      <SecondaryHero />
      <StatsSection />
      <FeaturesSection />
      <PackagesSection />
      <CTASection />
      <ContactSection />
      <Footer /></main>
  );
}
