import { Hero } from "@/components/ui/helix-hero";
import { SecondaryHero } from "@/components/home/secondary-hero";
import { StatsSection } from "@/components/home/stats-section";
import { FeaturesSection } from "@/components/home/features-section";
import { TrustedBySection } from "@/components/home/trusted-by-section";
import { CTASection } from "@/components/home/cta-section";
import { ContactSection } from "@/components/home/contact-section";
import { Footer } from "@/components/home/footer";
import { Navbar } from "@/components/home/navbar";

export default function Home() {
  return (
    <main id="home" className="home-navbar-offset homepage-bg">
      <Navbar />

      <Hero
        title="AI Voice Dialer"
        description="Intelligent voice communication platform powered by advanced AI agents. 
        Real-time speech recognition, natural language processing, and seamless 
        call automation for enterprise-scale outbound campaigns."
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
      <ContactSection />
      <TrustedBySection />
      <CTASection />
      <Footer /></main>
  );
}
