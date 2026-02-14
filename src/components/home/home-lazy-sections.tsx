"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Hero = dynamic(() => import("@/components/ui/helix-hero").then((m) => m.Hero), {
  ssr: false,
  loading: () => <HeroPlaceholder />,
});

const SecondaryHero = dynamic(() => import("@/components/home/secondary-hero").then((m) => m.SecondaryHero), {
  ssr: false,
  loading: () => <SectionPlaceholder minHeightClassName="min-h-[70vh]" />,
});

const StatsSection = dynamic(() => import("@/components/home/stats-section").then((m) => m.StatsSection), {
  ssr: false,
  loading: () => <SectionPlaceholder minHeightClassName="min-h-[260px]" />,
});

const FeaturesSection = dynamic(() => import("@/components/home/features-section").then((m) => m.FeaturesSection), {
  ssr: false,
  loading: () => <SectionPlaceholder minHeightClassName="min-h-[420px]" />,
});

const PackagesSection = dynamic(() => import("@/components/home/packages-section").then((m) => m.PackagesSection), {
  ssr: false,
  loading: () => <SectionPlaceholder minHeightClassName="min-h-[520px]" />,
});

const CTASection = dynamic(() => import("@/components/home/cta-section").then((m) => m.CTASection), {
  ssr: false,
  loading: () => <SectionPlaceholder minHeightClassName="min-h-[320px]" />,
});

const ContactSection = dynamic(() => import("@/components/home/contact-section").then((m) => m.ContactSection), {
  ssr: false,
  loading: () => <SectionPlaceholder minHeightClassName="min-h-[420px]" />,
});

const Footer = dynamic(() => import("@/components/home/footer").then((m) => m.Footer), {
  ssr: false,
  loading: () => <SectionPlaceholder minHeightClassName="min-h-[240px]" />,
});

function HeroPlaceholder() {
  return (
    <section className="relative overflow-hidden bg-cyan-100 dark:bg-background">
      <div className="mx-auto flex min-h-[72vh] max-w-7xl flex-col items-center justify-center px-4 py-14 md:px-6 lg:px-8">
        <div className="mb-6 text-center">
          <h1 className="text-5xl font-bold tracking-tighter text-primary dark:text-foreground md:text-7xl">AI VOICE</h1>
          <h2 className="mt-2 text-4xl font-bold tracking-tighter text-primary dark:text-foreground md:text-7xl">DIALER</h2>
        </div>
        <p className="mx-auto max-w-2xl text-center text-base font-light leading-relaxed text-muted-foreground md:text-lg">
          Intelligent voice communication platform powered by advanced AI agents, built to operate at scale with high accuracy and reliability.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-8">
          <div className="text-center">
            <div className="text-3xl font-semibold text-primary dark:text-foreground md:text-4xl">&lt;500ms</div>
            <div className="mt-1 text-sm uppercase tracking-wide text-muted-foreground">Response Time</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-semibold text-primary dark:text-foreground md:text-4xl">1000+</div>
            <div className="mt-1 text-sm uppercase tracking-wide text-muted-foreground">Concurrent Calls</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-semibold text-primary dark:text-foreground md:text-4xl">94%</div>
            <div className="mt-1 text-sm uppercase tracking-wide text-muted-foreground">Completion Rate</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionPlaceholder({ minHeightClassName }: { minHeightClassName: string }) {
  return (
    <section className={`bg-cyan-100 dark:bg-background ${minHeightClassName}`}>
      <div className="mx-auto h-full max-w-7xl px-4 md:px-6 lg:px-8" />
    </section>
  );
}

export function HomeLazySections() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const w = window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(() => setEnabled(true), { timeout: 1200 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setEnabled(true), 350);
    return () => window.clearTimeout(id);
  }, []);

  if (!enabled) {
    return (
      <>
        <HeroPlaceholder />
        <SectionPlaceholder minHeightClassName="min-h-[70vh]" />
        <SectionPlaceholder minHeightClassName="min-h-[260px]" />
        <SectionPlaceholder minHeightClassName="min-h-[420px]" />
        <SectionPlaceholder minHeightClassName="min-h-[520px]" />
        <SectionPlaceholder minHeightClassName="min-h-[320px]" />
        <SectionPlaceholder minHeightClassName="min-h-[420px]" />
        <SectionPlaceholder minHeightClassName="min-h-[240px]" />
      </>
    );
  }

  return (
    <>
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
      <Footer />
    </>
  );
}
