"use client";

import { motion, useAnimationControls } from "framer-motion";
import type { Variants } from "framer-motion";
import { Users, BarChart3, PhoneCall, Check } from "lucide-react";

const features = [
  {
    icon: PhoneCall,
    title: "Outbound Calling",
    description: "Automated sales calls, lead qualification, and customer outreach with AI agents that sound human.",
    iconColor: "text-primary dark:text-foreground",
    iconBg: "bg-primary/10",
    dotBg: "bg-primary/70 dark:bg-foreground/70",
    points: [
      "Lead generation and qualification",
      "Sales appointment setting",
      "Customer surveys and feedback",
      "Event reminders and confirmations"
    ]
  },
  {
    icon: Users,
    title: "Inbound Support",
    description: "24/7 customer service with intelligent AI agents that can handle complex inquiries.",
    iconColor: "text-sky-700 dark:text-sky-300",
    iconBg: "bg-sky-500/10",
    dotBg: "bg-sky-500/70 dark:bg-sky-400/70",
    points: [
      "Customer support and helpdesk",
      "Order status and tracking",
      "Technical troubleshooting",
      "Account management"
    ]
  },
  {
    icon: BarChart3,
    title: "Voice Analytics",
    description: "Advanced analytics and insights to optimize your communication strategies.",
    iconColor: "text-emerald-700 dark:text-emerald-300",
    iconBg: "bg-emerald-500/10",
    dotBg: "bg-emerald-500/70 dark:bg-emerald-400/70",
    points: [
      "Call performance metrics",
      "Sentiment analysis",
      "Conversation insights",
      "ROI tracking and reporting"
    ]
  }
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
    hidden: { opacity: 0, y: -46 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 240,
        damping: 18,
        mass: 0.8,
      },
    },
  };

  return (
    <section id="services" className="py-24 px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-primary dark:text-foreground"
          >
            Our Services
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            Comprehensive AI voice solutions for every business need
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
          className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              className="group w-full max-w-[420px] p-8 rounded-2xl border border-border/70 bg-card/70 backdrop-blur-sm hover:border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-lg ${feature.iconBg} ${feature.iconColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-primary dark:text-foreground mb-4 group-hover:text-primary/90 dark:group-hover:text-foreground/90 transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {feature.description}
              </p>
              <ul className="space-y-3">
                {feature.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <Check className={`mt-[2px] h-4 w-4 shrink-0 ${feature.iconColor}`} />
                    <span className="text-sm leading-snug text-muted-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
