"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, Cpu, Mic, PlayCircle, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

function SecondaryHeroVideoPlayer({ className }: { className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const videoARef = useRef<HTMLVideoElement | null>(null);
  const videoBRef = useRef<HTMLVideoElement | null>(null);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [isInView, setIsInView] = useState(false);

  const resolvedSrc = useMemo(() => src, [src]);
  const [activeVideo, setActiveVideo] = useState<0 | 1>(0);
  const activeVideoRef = useRef<0 | 1>(0);
  const isCrossfadingRef = useRef(false);

  useEffect(() => {
    const el = playerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const nextInView = Boolean(entry?.isIntersecting);
        setIsInView(nextInView);
        if (nextInView) setShouldLoadVideo(true);
      },
      { rootMargin: "240px 0px", threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoadVideo || resolvedSrc) return;
    let cancelled = false;
    const ac = new AbortController();
    const candidates = ["/images/ai-voice-section.mp4", "/images/ai-voice-section..mp4"];

    (async () => {
      for (const candidate of candidates) {
        try {
          const res = await fetch(candidate, { method: "HEAD", cache: "force-cache", signal: ac.signal });
          if (res.ok) {
            if (!cancelled) setSrc(candidate);
            return;
          }
        } catch {}
      }

      if (!cancelled) setSrc("/images/ai-voice-section..mp4");
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [resolvedSrc, shouldLoadVideo]);

  useEffect(() => {
    if (!shouldLoadVideo || !resolvedSrc) return;
    const playbackRate = 0.8;

    const applyPlaybackRate = () => {
      const a = videoARef.current;
      const b = videoBRef.current;
      if (a) {
        try {
          a.playbackRate = playbackRate;
          a.defaultPlaybackRate = playbackRate;
        } catch {}
      }
      if (b) {
        try {
          b.playbackRate = playbackRate;
          b.defaultPlaybackRate = playbackRate;
        } catch {}
      }
    };

    applyPlaybackRate();
    const intervalId = window.setInterval(applyPlaybackRate, 250);
    const intervalStopId = window.setTimeout(() => window.clearInterval(intervalId), 5000);
    const a = videoARef.current;
    const b = videoBRef.current;
    a?.addEventListener("loadedmetadata", applyPlaybackRate);
    a?.addEventListener("loadeddata", applyPlaybackRate);
    a?.addEventListener("canplay", applyPlaybackRate);
    a?.addEventListener("play", applyPlaybackRate);
    b?.addEventListener("loadedmetadata", applyPlaybackRate);
    b?.addEventListener("loadeddata", applyPlaybackRate);
    b?.addEventListener("canplay", applyPlaybackRate);
    b?.addEventListener("play", applyPlaybackRate);

    return () => {
      window.clearTimeout(intervalStopId);
      window.clearInterval(intervalId);
      a?.removeEventListener("loadedmetadata", applyPlaybackRate);
      a?.removeEventListener("loadeddata", applyPlaybackRate);
      a?.removeEventListener("canplay", applyPlaybackRate);
      a?.removeEventListener("play", applyPlaybackRate);
      b?.removeEventListener("loadedmetadata", applyPlaybackRate);
      b?.removeEventListener("loadeddata", applyPlaybackRate);
      b?.removeEventListener("canplay", applyPlaybackRate);
      b?.removeEventListener("play", applyPlaybackRate);
    };
  }, [resolvedSrc, shouldLoadVideo]);

  useEffect(() => {
    activeVideoRef.current = activeVideo;
  }, [activeVideo]);

  useEffect(() => {
    if (!shouldLoadVideo || !resolvedSrc) return;
    const a = videoARef.current;
    const b = videoBRef.current;
    if (!a || !b) return;

    isCrossfadingRef.current = false;
    setActiveVideo(0);
    activeVideoRef.current = 0;

    try {
      a.currentTime = 0;
    } catch {}
    try {
      b.currentTime = 0.01;
    } catch {}

    try {
      b.pause();
    } catch {}
    const p = a.play();
    if (p && typeof (p as Promise<void>).catch === "function") (p as Promise<void>).catch(() => {});

    return () => {
      try {
        a.pause();
        b.pause();
      } catch {}
    };
  }, [resolvedSrc, shouldLoadVideo]);

  useEffect(() => {
    if (!shouldLoadVideo || !resolvedSrc) return;
    const crossfadeMs = 320;
    const loopThresholdSeconds = 0.45;
    const loopToTimeSeconds = 0.01;

    const waitForStart = (el: HTMLVideoElement, timeoutMs: number) =>
      new Promise<void>((resolve) => {
        if (!el.paused && !el.ended) return resolve();

        let done = false;
        let frameRequestId = 0;
        const finish = () => {
          if (done) return;
          done = true;
          el.removeEventListener("playing", onPlaying);
          el.removeEventListener("timeupdate", onTimeUpdate);
          if (frameRequestId) {
            const cancel = (el as unknown as { cancelVideoFrameCallback?: (id: number) => void }).cancelVideoFrameCallback;
            cancel?.call(el, frameRequestId);
          }
          resolve();
        };

        const onPlaying = () => finish();
        const onTimeUpdate = () => {
          if (el.currentTime > loopToTimeSeconds + 0.02) finish();
        };

        el.addEventListener("playing", onPlaying);
        el.addEventListener("timeupdate", onTimeUpdate);

        const request = (el as unknown as { requestVideoFrameCallback?: (cb: () => void) => number }).requestVideoFrameCallback;
        if (request) frameRequestId = request.call(el, () => finish());
        window.setTimeout(finish, timeoutMs);
      });

    const check = () => {
      const a = videoARef.current;
      const b = videoBRef.current;
      if (!a || !b) return;
      if (isCrossfadingRef.current) return;

      const currentIndex = activeVideoRef.current;
      const current = currentIndex === 0 ? a : b;
      const next = currentIndex === 0 ? b : a;
      const duration = current.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;
      if (current.paused || current.ended) return;
      if (current.currentTime < duration - loopThresholdSeconds) return;

      isCrossfadingRef.current = true;

      (async () => {
        try {
          next.currentTime = loopToTimeSeconds;
        } catch {}

        const p = next.play();
        if (p && typeof (p as Promise<void>).catch === "function") (p as Promise<void>).catch(() => {});

        await waitForStart(next, 350);

        setActiveVideo(currentIndex === 0 ? 1 : 0);
        activeVideoRef.current = currentIndex === 0 ? 1 : 0;

        window.setTimeout(() => {
          try {
            current.pause();
          } catch {}
          try {
            current.currentTime = loopToTimeSeconds;
          } catch {}
          isCrossfadingRef.current = false;
        }, crossfadeMs);
      })();
    };

    if (!isInView) return;

    const a = videoARef.current;
    const b = videoBRef.current;
    if (!a || !b) return;

    const onTimeUpdate = () => {
      check();
    };

    a.addEventListener("timeupdate", onTimeUpdate);
    b.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      a.removeEventListener("timeupdate", onTimeUpdate);
      b.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [isInView, resolvedSrc, shouldLoadVideo]);

  useEffect(() => {
    if (!shouldLoadVideo || !resolvedSrc) return;
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

    const currentIndex = activeVideoRef.current;
    const current = currentIndex === 0 ? a : b;
    const p = current.play();
    if (p && typeof (p as Promise<void>).catch === "function") (p as Promise<void>).catch(() => {});
  }, [isInView, resolvedSrc, shouldLoadVideo]);

  if (!shouldLoadVideo || !resolvedSrc) {
    return (
      <div ref={playerRef} className={`secondaryHeroPlayer ${className ?? ""}`}>
        <Image
          src="/images/ai-voice-section..jpg"
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 600px"
          className="secondaryHeroPoster"
        />
        <style jsx>{`
          .secondaryHeroPlayer {
            position: relative;
            width: 100%;
            height: 100%;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
            overflow: hidden;
            border-radius: 14px;
          }

          :global(.secondaryHeroPoster) {
            object-fit: cover;
            border-radius: 14px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      ref={playerRef}
      className={`secondaryHeroPlayer ${className ?? ""}`}
      onMouseDown={(e) => {
        if (e.button === 2) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onAuxClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onContextMenuCapture={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <video
        ref={videoARef}
        className={`secondaryHeroVideo secondaryHeroVideoLayer ${activeVideo === 0 ? "active" : ""}`}
        src={resolvedSrc}
        autoPlay
        muted
        playsInline
        preload="metadata"
        poster="/images/ai-voice-section..jpg"
        controls={false}
        controlsList="nodownload noremoteplayback noplaybackrate"
        disablePictureInPicture
        disableRemotePlayback
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onError={() => {
          setSrc((prev) => (prev?.endsWith("ai-voice-section..mp4") ? prev : "/images/ai-voice-section..mp4"));
        }}
      >
        Your browser does not support the video tag.
      </video>

      <video
        ref={videoBRef}
        className={`secondaryHeroVideo secondaryHeroVideoLayer ${activeVideo === 1 ? "active" : ""}`}
        src={resolvedSrc}
        autoPlay
        muted
        playsInline
        preload="metadata"
        poster="/images/ai-voice-section..jpg"
        controls={false}
        controlsList="nodownload noremoteplayback noplaybackrate"
        disablePictureInPicture
        disableRemotePlayback
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onError={() => {
          setSrc((prev) => (prev?.endsWith("ai-voice-section..mp4") ? prev : "/images/ai-voice-section..mp4"));
        }}
      >
        Your browser does not support the video tag.
      </video>

      <style jsx>{`
        .secondaryHeroPlayer {
          position: relative;
          width: 100%;
          height: 100%;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          overflow: hidden;
          border-radius: 14px;
        }

        .secondaryHeroVideoLayer {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 320ms ease-in-out;
          will-change: opacity;
        }

        .secondaryHeroVideoLayer.active {
          opacity: 1;
        }

        .secondaryHeroVideo {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 14px;
          background: transparent;
        }
      `}</style>
    </div>
  );
}

export function SecondaryHero() {
  return (
    <>
      <section className="secondaryHeroSection bg-cyan-100 dark:bg-background box-border py-6 sm:py-10 md:py-12 lg:py-14 px-4 md:px-6 lg:px-8 overflow-visible">
        <div className="w-full max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="w-full overflow-hidden box-border bg-background/70 dark:bg-background/10 backdrop-blur-sm shadow-sm secondaryHeroCard"
            style={{
              backgroundImage: "var(--home-card-gradient)",
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="secondaryHeroGrid grid grid-cols-1 md:grid-cols-[minmax(0,560px)_minmax(0,1fr)] md:items-stretch">
            <figure
              aria-label="AI voice calling section video"
              tabIndex={0}
              className="secondaryHeroImageWrap order-1 md:order-1 relative isolate overflow-hidden border-b md:border-b-0 md:border-r border-border/60 bg-background/50 w-full min-h-[220px] sm:min-h-[280px] md:min-h-[520px] max-w-[600px] mx-auto md:max-w-none md:mx-0 rounded-[14px]"
            >
              <SecondaryHeroVideoPlayer />
            </figure>

            <div className="secondaryHeroContent order-2 md:order-2 px-4 py-6 sm:px-5 sm:py-8 md:px-10 md:py-10 lg:px-12 lg:py-10 text-center md:text-left flex flex-col justify-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] font-bold tracking-tight text-primary dark:text-foreground leading-[1.06]">
                <span className="block">Own Your AI Voice Agent Platform</span>
                <span className="block">Take Full Control</span>
              </h2>

              <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-gray-700 dark:text-muted-foreground max-w-2xl md:mx-0 mx-auto leading-relaxed">
                Stop renting AI. Start owning it. Protect your IP, secure your data, and scale with confidence on dedicated infrastructure.
              </p>

              <div className="secondaryHeroFeatures mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl md:max-w-none md:mr-10 mx-auto md:mx-0">
                <div
                  className="rounded-2xl border border-border/70 bg-background/70 dark:bg-white/5 backdrop-blur-sm p-4 transition-transform duration-200 ease-out hover:scale-[1.01]"
                  style={{
                    backgroundImage: "var(--home-card-gradient)",
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-white dark:bg-white shadow-sm">
                      <Bot className="h-4 w-4 text-black" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-primary dark:text-foreground">Custom AI Voice Agents</div>
                      <div className="mt-1 text-sm text-gray-700 dark:text-muted-foreground leading-relaxed">
                        Fine‑tuned with your recordings and transcriptions. Deliver automated phone calls AI, inbound/outbound support, and appointment scheduling that sound truly human.
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="rounded-2xl border border-border/70 bg-background/70 dark:bg-white/5 backdrop-blur-sm p-4 transition-transform duration-200 ease-out hover:scale-[1.01]"
                  style={{
                    backgroundImage: "var(--home-card-gradient)",
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-white dark:bg-white shadow-sm">
                      <Cpu className="h-4 w-4 text-black" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-primary dark:text-foreground">Dedicated Infrastructure</div>
                      <div className="mt-1 text-sm text-gray-700 dark:text-muted-foreground leading-relaxed">
                        Your servers. Your GPUs. Enterprise‑grade AI call automation built for performance and reliability.
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="rounded-2xl border border-border/70 bg-background/70 dark:bg-white/5 backdrop-blur-sm p-4 transition-transform duration-200 ease-out hover:scale-[1.01]"
                  style={{
                    backgroundImage: "var(--home-card-gradient)",
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-white dark:bg-white shadow-sm">
                      <Mic className="h-4 w-4 text-black" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-primary dark:text-foreground">Unique Brand Voice</div>
                      <div className="mt-1 text-sm text-gray-700 dark:text-muted-foreground leading-relaxed">
                        Choose a voice actor. Turn your AI voice assistant for call centers into the voice of your brand.
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="rounded-2xl border border-border/70 bg-background/70 dark:bg-white/5 backdrop-blur-sm p-4 transition-transform duration-200 ease-out hover:scale-[1.01]"
                  style={{
                    backgroundImage: "var(--home-card-gradient)",
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-white dark:bg-white shadow-sm">
                      <ShieldCheck className="h-4 w-4 text-black" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-primary dark:text-foreground">Protected Data</div>
                      <div className="mt-1 text-sm text-gray-700 dark:text-muted-foreground leading-relaxed">
                        Encrypted. Secure. Yours alone. Every customer interaction and call routing stays on your dedicated servers.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="secondaryHeroCtas mt-4 sm:mt-6 flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-3 sm:gap-4">
                <Link href="/auth/register">
                  <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 sm:px-8 h-10 sm:h-12 text-sm sm:text-base font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105 dark:bg-indigo-500 dark:hover:bg-indigo-400">
                    Start Free Trial
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="#use-cases">
                  <Button size="lg" variant="outline" className="rounded-full px-6 sm:px-8 h-10 sm:h-12 text-sm sm:text-base font-semibold border-border text-foreground hover:text-foreground transition-all hover:scale-105 hover:bg-background">
                    View Use Cases
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .secondaryHeroSection {
          box-sizing: border-box;
        }

        @media (max-height: 700px) {
          .secondaryHeroSection {
            padding-top: 8px;
            padding-bottom: 8px;
          }
        }

        @media (width: 768px) and (height: 1024px) and (orientation: portrait) {
          :global(.secondaryHeroGrid) {
            grid-template-columns: 1fr !important;
          }

          :global(.secondaryHeroPlayer) {
            max-width: 100% !important;
          }

          :global(.secondaryHeroImageWrap) {
            max-width: 100% !important;
            min-height: 380px !important;
            border-right: 0 !important;
            border-bottom: 1px solid rgba(0, 0, 0, 0.12);
            background-color: #ffffff !important;
          }

          :global(.dark) :global(.secondaryHeroImageWrap) {
            border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          }

          :global(.secondaryHeroContent) {
            text-align: center !important;
            padding-left: 20px !important;
            padding-right: 20px !important;
          }

          :global(.secondaryHeroFeatures) {
            margin-left: auto !important;
            margin-right: auto !important;
            max-width: 42rem !important;
          }

          :global(.secondaryHeroCtas) {
            justify-content: center !important;
            align-items: center !important;
          }
        }

        @media (width: 820px) and (height: 1180px) and (orientation: portrait) {
          :global(.secondaryHeroGrid) {
            grid-template-columns: 1fr !important;
          }

          :global(.secondaryHeroPlayer) {
            max-width: 100% !important;
          }

          :global(.secondaryHeroImageWrap) {
            max-width: 100% !important;
            min-height: 420px !important;
            border-right: 0 !important;
            border-bottom: 1px solid rgba(0, 0, 0, 0.12);
            background-color: #ffffff !important;
          }

          :global(.dark) :global(.secondaryHeroImageWrap) {
            border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          }

          :global(.secondaryHeroContent) {
            text-align: center !important;
            padding-left: 24px !important;
            padding-right: 24px !important;
          }

          :global(.secondaryHeroFeatures) {
            margin-left: auto !important;
            margin-right: auto !important;
            max-width: 46rem !important;
          }

          :global(.secondaryHeroCtas) {
            justify-content: center !important;
            align-items: center !important;
          }
        }

        @media (width: 834px) and (height: 1194px) and (orientation: portrait) {
          :global(.secondaryHeroGrid) {
            grid-template-columns: 1fr !important;
          }

          :global(.secondaryHeroPlayer) {
            max-width: 100% !important;
          }

          :global(.secondaryHeroImageWrap) {
            max-width: 100% !important;
            min-height: 420px !important;
            border-right: 0 !important;
            border-bottom: 1px solid rgba(0, 0, 0, 0.12);
            background-color: #ffffff !important;
          }

          :global(.dark) :global(.secondaryHeroImageWrap) {
            border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          }

          :global(.secondaryHeroContent) {
            text-align: center !important;
            padding-left: 24px !important;
            padding-right: 24px !important;
          }

          :global(.secondaryHeroFeatures) {
            margin-left: auto !important;
            margin-right: auto !important;
            max-width: 46rem !important;
          }

          :global(.secondaryHeroCtas) {
            justify-content: center !important;
            align-items: center !important;
          }
        }

        @media (width: 1024px) and (height: 1366px) and (orientation: portrait) {
          :global(.secondaryHeroGrid) {
            grid-template-columns: 1fr !important;
          }

          :global(.secondaryHeroPlayer) {
            max-width: 100% !important;
          }

          :global(.secondaryHeroImageWrap) {
            max-width: 100% !important;
            min-height: 520px !important;
            border-right: 0 !important;
            border-bottom: 1px solid rgba(0, 0, 0, 0.12);
            background-color: #ffffff !important;
          }

          :global(.dark) :global(.secondaryHeroImageWrap) {
            border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          }

          :global(.secondaryHeroContent) {
            text-align: center !important;
            padding-left: 28px !important;
            padding-right: 28px !important;
          }

          :global(.secondaryHeroFeatures) {
            margin-left: auto !important;
            margin-right: auto !important;
            max-width: 50rem !important;
          }

          :global(.secondaryHeroCtas) {
            justify-content: center !important;
            align-items: center !important;
          }
        }

        @media (width: 912px) and (height: 1368px) and (orientation: portrait) {
          :global(.secondaryHeroGrid) {
            grid-template-columns: 1fr !important;
          }

          :global(.secondaryHeroPlayer) {
            max-width: 100% !important;
          }

          :global(.secondaryHeroImageWrap) {
            max-width: 100% !important;
            min-height: 500px !important;
            border-right: 0 !important;
            border-bottom: 1px solid rgba(0, 0, 0, 0.12);
            background-color: #ffffff !important;
          }

          :global(.dark) :global(.secondaryHeroImageWrap) {
            border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          }

          :global(.secondaryHeroContent) {
            text-align: center !important;
            padding-left: 26px !important;
            padding-right: 26px !important;
          }

          :global(.secondaryHeroFeatures) {
            margin-left: auto !important;
            margin-right: auto !important;
            max-width: 48rem !important;
          }

          :global(.secondaryHeroCtas) {
            justify-content: center !important;
            align-items: center !important;
          }
        }

        @media (width: 853px) and (height: 1280px) and (orientation: portrait) {
          :global(.secondaryHeroGrid) {
            grid-template-columns: 1fr !important;
          }

          :global(.secondaryHeroPlayer) {
            max-width: 100% !important;
          }

          :global(.secondaryHeroImageWrap) {
            max-width: 100% !important;
            min-height: 520px !important;
            border-right: 0 !important;
            border-bottom: 1px solid rgba(0, 0, 0, 0.12);
            background-color: #ffffff !important;
          }

          :global(.dark) :global(.secondaryHeroImageWrap) {
            border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          }

          :global(.secondaryHeroContent) {
            text-align: center !important;
            padding-left: 28px !important;
            padding-right: 28px !important;
          }

          :global(.secondaryHeroFeatures) {
            margin-left: auto !important;
            margin-right: auto !important;
            max-width: 50rem !important;
          }

          :global(.secondaryHeroCtas) {
            justify-content: center !important;
            align-items: center !important;
          }
        }

        @media (width: 1024px) and (height: 600px) and (orientation: landscape) {
          :global(.secondaryHeroGrid) {
            grid-template-columns: 1fr !important;
          }

          :global(.secondaryHeroPlayer) {
            max-width: 100% !important;
          }

          :global(.secondaryHeroImageWrap) {
            max-width: 100% !important;
            min-height: 300px !important;
            border-right: 0 !important;
            border-bottom: 1px solid rgba(0, 0, 0, 0.12);
            background-color: #ffffff !important;
          }

          :global(.dark) :global(.secondaryHeroImageWrap) {
            border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          }

          :global(.secondaryHeroContent) {
            text-align: center !important;
            padding-left: 24px !important;
            padding-right: 24px !important;
          }

          :global(.secondaryHeroFeatures) {
            margin-left: auto !important;
            margin-right: auto !important;
            max-width: 46rem !important;
          }

          :global(.secondaryHeroCtas) {
            justify-content: center !important;
            align-items: center !important;
          }
        }

        @media (hover: hover) and (pointer: fine) {
          .secondaryHeroSection:hover :global(.secondaryHeroCard) {
            box-shadow: 0 18px 50px rgba(0, 0, 0, 0.08);
            border-color: rgba(0, 0, 0, 0.08);
          }
          :global(.dark) .secondaryHeroSection:hover :global(.secondaryHeroCard) {
            box-shadow: 0 18px 50px rgba(0, 0, 0, 0.5);
            border-color: rgba(255, 255, 255, 0.12);
          }
        }

        .secondaryHeroImageWrap {
          z-index: 0;
          transform-style: preserve-3d;
          transition: box-shadow 300ms ease-in-out, transform 300ms ease-in-out;
          will-change: transform;
          transform-origin: center;
        }

        @media (min-width: 768px) {
          .secondaryHeroImageWrap {
            transform-origin: right center;
          }
        }

        .secondaryHeroImage {
          z-index: 0;
          backface-visibility: hidden;
          transform-origin: 35% 50%;
          transform: perspective(1000px) rotateY(-10deg) scale(1);
          transition: transform 300ms ease-in-out, filter 300ms ease-in-out;
          filter: saturate(1.06) contrast(1.03);
          will-change: transform, filter;
        }

        @media (hover: hover) and (pointer: fine) {
          .secondaryHeroImageWrap:hover {
            z-index: 2;
            box-shadow: 0 18px 56px rgba(0, 0, 0, 0.14);
            transform: scale(1.06);
          }

          .secondaryHeroImageWrap:hover .secondaryHeroImage {
            transform: perspective(1000px) rotateY(0deg) scale(1.06);
            filter: saturate(1.12) contrast(1.06);
          }
        }

        .secondaryHeroImageWrap:focus-visible .secondaryHeroImage {
          transform: perspective(1000px) rotateY(0deg) scale(1.06);
          filter: saturate(1.12) contrast(1.06);
        }

        .secondaryHeroContent {
          transition: transform 300ms ease-in-out;
          will-change: transform;
          transform-origin: center;
        }

        @media (min-width: 768px) {
          .secondaryHeroContent {
            transform-origin: left center;
          }
        }

        @media (hover: hover) and (pointer: fine) {
          .secondaryHeroContent:hover {
            transform: none;
          }
        }

        @media (hover: none) and (pointer: coarse) {
          .secondaryHeroImageWrap:active .secondaryHeroImage {
            transform: perspective(1000px) rotateY(0deg) scale(1.03);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .secondaryHeroImage {
            transition: none;
            transform: none;
          }
        }
      `}</style>
      </section>

      <section className="bg-cyan-100 dark:bg-background px-4 md:px-6 lg:px-8 pb-12">
        <div className="mx-auto w-full max-w-7xl">
          <div
            className="rounded-2xl border border-border/70 bg-transparent backdrop-blur-sm p-6 sm:p-7 shadow-sm transition-[transform,filter,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-[1.02] hover:border-border hover:shadow-md"
            style={{
              backgroundImage: "var(--home-card-gradient)",
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-5">
              <div className="mx-auto md:mx-0 mt-0.5 flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-white shadow-sm">
                <PlayCircle className="h-5 w-5 text-black" aria-hidden />
              </div>
              <div className="min-w-0 text-center md:text-left">
                <div className="text-lg font-semibold text-primary dark:text-foreground">Experience Our AI Voice Agent Live</div>
                <div className="mt-2 text-sm sm:text-base text-gray-700 dark:text-muted-foreground leading-relaxed">
                  See how natural conversations, call automation, and real-time routing work end-to-end.
                </div>
                <div className="mt-5 flex justify-center md:justify-start">
                  <Link href="#contact">
                    <Button
                      size="lg"
                      variant="outline"
                      className="rounded-full px-7 h-11 text-sm font-semibold border-border transition-transform hover:scale-105 hover:bg-background hover:text-foreground hover:border-border"
                    >
                      Talk to our team
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
