"use client";

import { motion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { useMemo, useState } from "react";

export function TrustedBySection() {
  const industries = useMemo(() => ["Healthcare", "Real Estate", "E-commerce", "Financial Services"], []);
  const [paused, setPaused] = useState(false);

  return (
    <section className="py-20 px-4 md:px-6 lg:px-8 border-t border-border/60">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-primary dark:text-foreground"
        >
          Trusted by Industry Leaders
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
        >
          Join Fortune 500 companies and innovative startups that rely on our AI voice platform
          for critical business communications.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="pt-8 flex items-center gap-4"
        >
          <button
            type="button"
            onClick={() => setPaused((v) => !v)}
            className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm text-muted-foreground transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out hover:scale-[1.05] hover:bg-card/80 hover:border-border hover:text-primary dark:hover:text-foreground hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={paused ? "Play industries ticker" : "Pause industries ticker"}
            aria-pressed={paused}
          >
            {paused ? <Play className="w-5 h-5" aria-hidden /> : <Pause className="w-5 h-5" aria-hidden />}
          </button>

          <div className="relative flex-1 overflow-hidden">
            <div className="trusted-by-marquee flex w-max items-center gap-8 pr-8" style={{ animationPlayState: paused ? "paused" : "running" }}>
              {[0, 1].map((dup) => (
                <div key={dup} className="flex items-center gap-8">
                  {industries.map((name) => (
                    <div
                      key={`${dup}-${name}`}
                      className="flex items-center justify-center h-12 md:h-14 px-8 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm text-sm md:text-base font-semibold text-muted-foreground transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out hover:scale-[1.03] hover:bg-card/80 hover:border-border hover:text-primary dark:hover:text-foreground hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      tabIndex={0}
                    >
                      {name}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .trusted-by-marquee {
          animation: trustedByMarquee 18s linear infinite;
        }
        @keyframes trustedByMarquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .trusted-by-marquee {
            animation: none;
            transform: translateX(0);
          }
        }
      `}</style>
    </section>
  );
}
