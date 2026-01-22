"use client";

import { motion } from "framer-motion";

const stats = [
  { label: "Uptime", value: "99.9%" },
  { label: "Calls Handled", value: "10M+" },
  { label: "Customer Satisfaction", value: "95%" },
];

export function StatsSection() {
  return (
    <section className="py-12 px-4 md:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                scale: { duration: 0.25, ease: "easeInOut" },
              }}
              className="stats-card bg-card/80 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-border/70 flex flex-col items-center justify-center text-center"
              tabIndex={0}
            >
              <div className="text-4xl md:text-5xl font-bold text-indigo-700 dark:text-indigo-300 mb-2">
                {stat.value}
              </div>
              <div className="text-muted-foreground font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
