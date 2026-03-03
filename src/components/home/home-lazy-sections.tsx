"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Hero } from "@/components/ui/helix-hero";

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

function SectionPlaceholder({ minHeightClassName }: { minHeightClassName: string }) {
  return (
    <section className={`bg-cyan-100 dark:bg-background ${minHeightClassName}`}>
      <div className="mx-auto h-full max-w-7xl px-4 md:px-6 lg:px-8" />
    </section>
  );
}

function FAQSection() {
  const items = [
    {
      question: "What is Talkly AI?",
      answer:
        "Talkly AI is a fully featured platform that automates phone calls with intelligent voice agents, helping teams scale conversations without queues or delays.",
    },
    {
      question: "Do I need technical expertise to use Talkly AI?",
      answer: "No. Our guided AI builder makes it simple to design call flows and prompts without coding.",
    },
    {
      question: "Can Talkly AI integrate with my existing phone system or CRM?",
      answer: "Yes. Talkly AI connects seamlessly with phone systems, CRMs like HubSpot, and lead forms.",
    },
    {
      question: "How does Talkly AI learn my company information?",
      answer: "You can upload PDFs, images, or crawl entire websites to instantly train your agent with the right knowledge.",
    },
    {
      question: "Can calls be transferred to human agents?",
      answer: "Absolutely. Talkly AI can forward calls to live agents whenever needed or requested by customers.",
    },
    {
      question: "Is Talkly AI secure and compliant?",
      answer: "Yes. We provide built‑in consent handling, encryption, GDPR/TCPA tooling, and enterprise‑grade compliance features.",
    },
    {
      question: "Can I resell Talkly AI under my own brand?",
      answer: "Yes. Our white‑label program lets you offer AI voice solutions as your own. Limited spots available.",
    },
    {
      question: "Do you provide phone numbers for campaigns?",
      answer: "Talkly AI issues dedicated numbers for your outbound and inbound campaigns.",
    },
  ];

  return (
    <section id="faq" className="bg-cyan-100 dark:bg-background py-20 px-4 md:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-center text-2xl md:text-3xl font-semibold text-primary dark:text-foreground">
          Frequently Asked Questions - Talkly AI
        </h2>
        <div className="mt-10 space-y-3">
          {items.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-gray-200 bg-transparent backdrop-blur-sm p-5 shadow-sm transition-[transform,filter,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-[1.02] hover:border-gray-200 hover:shadow-md dark:border-border/70"
              style={{
                backgroundImage: "var(--home-card-gradient)",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
              }}
            >
              <summary className="cursor-pointer list-none font-semibold text-primary dark:text-foreground">
                {item.question}
              </summary>
              <p className="mt-3 text-sm sm:text-base text-gray-700 dark:text-muted-foreground leading-relaxed">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function NavbarHeroBackgroundVideo() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const videoARef = useRef<HTMLVideoElement | null>(null);
  const videoBRef = useRef<HTMLVideoElement | null>(null);
  const activeIndexRef = useRef<0 | 1>(0);
  const isCrossfadingRef = useRef(false);
  const fadeTimeoutRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<0 | 1>(0);
  const [isInView, setIsInView] = useState(true);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsInView(Boolean(entry?.isIntersecting));
      },
      { threshold: 0.01 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  const triggerCrossfade = useCallback(() => {
    const videoA = videoARef.current;
    const videoB = videoBRef.current;
    if (!videoA || !videoB) return;
    if (isCrossfadingRef.current) return;

    const fromIndex = activeIndexRef.current;
    const toIndex: 0 | 1 = fromIndex === 0 ? 1 : 0;
    const from = fromIndex === 0 ? videoA : videoB;
    const to = toIndex === 0 ? videoA : videoB;

    isCrossfadingRef.current = true;

    try {
      to.currentTime = 0.01;
    } catch {}
    const p = to.play();
    if (p && typeof (p as Promise<void>).catch === "function") (p as Promise<void>).catch(() => {});

    activeIndexRef.current = toIndex;
    setActiveIndex(toIndex);

    if (fadeTimeoutRef.current) window.clearTimeout(fadeTimeoutRef.current);
    fadeTimeoutRef.current = window.setTimeout(() => {
      try {
        from.pause();
        from.currentTime = 0.01;
      } catch {}
      isCrossfadingRef.current = false;
    }, 320);
  }, []);

  useEffect(() => {
    const a = videoARef.current;
    const b = videoBRef.current;
    if (!a || !b) return;

    if (!isInView) {
      try {
        a.pause();
        b.pause();
      } catch {}
      return;
    }

    const active = activeIndexRef.current === 0 ? a : b;
    const p = active.play();
    if (p && typeof (p as Promise<void>).catch === "function") (p as Promise<void>).catch(() => {});
  }, [isInView]);

  useEffect(() => {
    if (!isInView) return;

    const loopThresholdSeconds = 0.24;
    const tick = () => {
      const videoA = videoARef.current;
      const videoB = videoBRef.current;
      if (videoA && videoB && !isCrossfadingRef.current) {
        const active = activeIndexRef.current === 0 ? videoA : videoB;
        const duration = active.duration;
        if (Number.isFinite(duration) && duration > 0 && !active.paused && !active.ended) {
          const remaining = duration - active.currentTime;
          if (remaining > 0 && remaining <= loopThresholdSeconds) triggerCrossfade();
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isInView, triggerCrossfade]);

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) window.clearTimeout(fadeTimeoutRef.current);
    };
  }, []);

  return (
    <div ref={wrapRef} className="pointer-events-none absolute inset-x-0 top-0 z-0 h-screen overflow-hidden" aria-hidden="true">
      <video
        ref={videoARef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: activeIndex === 0 ? 1 : 0, transition: "opacity 320ms ease-in-out" }}
        src="/images/hero-navbar-video.mp4"
        autoPlay
        muted
        playsInline
        preload="metadata"
        disablePictureInPicture
        disableRemotePlayback
        onLoadedMetadata={() => {
          if (!isInView) return;
          if (activeIndexRef.current !== 0) return;
          const v = videoARef.current;
          if (!v) return;
          void v.play().catch(() => {});
        }}
      />
      <video
        ref={videoBRef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: activeIndex === 1 ? 1 : 0, transition: "opacity 320ms ease-in-out" }}
        src="/images/hero-navbar-video.mp4"
        autoPlay
        muted
        playsInline
        preload="metadata"
        disablePictureInPicture
        disableRemotePlayback
        onLoadedMetadata={() => {
          if (!isInView) return;
          if (activeIndexRef.current !== 1) return;
          const v = videoBRef.current;
          if (!v) return;
          void v.play().catch(() => {});
        }}
      />
    </div>
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
        <NavbarHeroBackgroundVideo />
        <div className="relative z-10">
          <Hero
            title="AI Voice Agent Platform for Seamless Call Automation"
            description={[
              "Automate inbound and outbound calls with intelligent AI voice agents that deliver end-to-end customer support, appointment scheduling, and enterprise-grade engagement — 24/7.",
            ]}
            adjustForNavbar
            stats={[
              { label: "Response Time", value: "<500ms" },
              { label: "Concurrent Calls", value: "1000+" },
              { label: "Completion Rate", value: "94%" },
            ]}
          />
          <SectionPlaceholder minHeightClassName="min-h-[70vh]" />
          <SectionPlaceholder minHeightClassName="min-h-[260px]" />
          <SectionPlaceholder minHeightClassName="min-h-[420px]" />
          <SectionPlaceholder minHeightClassName="min-h-[520px]" />
          <SectionPlaceholder minHeightClassName="min-h-[320px]" />
          <SectionPlaceholder minHeightClassName="min-h-[520px]" />
          <SectionPlaceholder minHeightClassName="min-h-[420px]" />
          <SectionPlaceholder minHeightClassName="min-h-[240px]" />
        </div>
      </>
    );
  }

  return (
    <>
      <NavbarHeroBackgroundVideo />
      <div className="relative z-10">
        <Hero
          title="AI Voice Agent Platform for Seamless Call Automation"
          description={[
            "Automate inbound and outbound calls with intelligent AI voice agents that deliver end-to-end customer support, appointment scheduling, and enterprise-grade engagement — 24/7.",
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
        <PackagesSection />
        <FeaturesSection />
        <CTASection />
        <FAQSection />
        <ContactSection />
        <Footer />
      </div>
    </>
  );
}
