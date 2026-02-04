"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export function SecondaryHero() {
  return (
    <section className="py-20 px-4 md:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.04, y: -2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/60 border border-border text-sm font-medium text-muted-foreground"
        >
          <CheckCircle className="w-4 h-4 text-foreground" />
          <span>Trusted by 10,000+ businesses worldwide</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -4 }}
          className="w-full mx-auto border border-border bg-background/70 dark:bg-background/10 backdrop-blur-sm px-6 py-10 md:px-10 md:py-12 shadow-sm"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary dark:text-foreground">
            AI Voice Calling
            <br />
            Reimagined
          </h2>

          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Transform customer interactions with hyper-realistic AI voices that engage, convert, and scale your business
            24/7.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full mx-auto flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/auth/register">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105 dark:bg-indigo-500 dark:hover:bg-indigo-400">
              Start Free Trial
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link href="#packages">
            <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-base font-semibold border-border hover:bg-accent text-foreground hover:text-foreground transition-all hover:scale-105">
              View Pricing
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
