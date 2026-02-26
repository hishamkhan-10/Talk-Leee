"use client";

import { motion, useAnimationControls } from "framer-motion";
import type { Variants } from "framer-motion";
import { BarChart3, Bot, Megaphone, Mic, PhoneCall, Settings, Target, Users } from "lucide-react";

const services = [
  {
    icon: PhoneCall,
    title: "Simultaneous Calls",
    description: "Run 50+ calls in parallel with no queues, ensuring immediate outreach and response.",
  },
  {
    icon: Users,
    title: "Knowledgebase Integration",
    description: "Upload PDFs, images, or crawl websites so agents speak with your latest, accurate information.",
  },
  {
    icon: Bot,
    title: "AI Builder",
    description: "Step-by-step wizard to design agent behavior and call flows without writing code.",
  },
  {
    icon: Mic,
    title: "White‑Label Autocalls",
    description: "Resell Talkly AI under your own brand with dedicated access (limited spots).",
  },
  {
    icon: Settings,
    title: "Human Transfers",
    description: "Seamlessly forward calls to live agents whenever needed, preserving conversation context.",
  },
  {
    icon: BarChart3,
    title: "Detailed Reports",
    description: "Access recordings, transcriptions, and custom charts for performance and QA.",
  },
  {
    icon: Target,
    title: "Focus on Priorities",
    description: "Let AI handle repetitive calls so your team can focus on impact.",
  },
  {
    icon: Megaphone,
    title: "Outbound Campaigns",
    description: "Import leads or connect with HubSpot/forms for automated outreach.",
  },
];

export function FeaturesSection() {
  const controls = useAnimationControls();

  const gridVariants: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.14,
        delayChildren: 0.06,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.35,
        ease: "easeOut",
      },
    },
  };

  return (
    <section id="services" className="bg-cyan-100 dark:bg-background py-24 px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold tracking-tight text-gray-950 dark:text-foreground"
          >
            Talkly AI — The Complete Platform for Automated Phone Calls AI
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg font-light text-gray-700 dark:text-muted-foreground"
          >
            Talkly AI is the all‑in‑one platform to automate and scale phone calls with intelligent voice agents.
          </motion.p>
        </div>

        <motion.div
          variants={gridVariants}
          initial="hidden"
          animate={controls}
          viewport={{ amount: 0.4 }}
          onViewportEnter={() => {
            void controls.start("show");
          }}
          onViewportLeave={() => {
            controls.set("hidden");
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
        >
          {services.map((service) => (
            <motion.div
              key={service.title}
              variants={cardVariants}
              className="home-services-card group h-full rounded-2xl border border-gray-200 bg-transparent p-8 shadow-sm transition-[transform,filter,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-[1.02] hover:border-gray-200 hover:shadow-md dark:border-border/70"
              style={{
                backgroundImage: "var(--home-card-gradient)",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className="mb-6 flex items-center justify-start">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-[background-color,border-color] duration-200 ease-out group-hover:bg-gray-100 dark:border-border/70 dark:bg-white dark:group-hover:bg-gray-100">
                  <service.icon className="h-6 w-6 text-black" aria-hidden />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-950 dark:text-foreground transition-colors duration-200 ease-out">
                {service.title}
              </h3>
              <p className="mt-2 text-sm sm:text-base font-light leading-relaxed text-gray-700 dark:text-muted-foreground">
                {service.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
