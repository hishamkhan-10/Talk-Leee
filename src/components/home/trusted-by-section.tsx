"use client";

import { motion } from "framer-motion";

export function TrustedBySection() {
  return (
    <section className="py-20 px-4 md:px-6 lg:px-8 bg-background border-t border-border/60">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-foreground"
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
        
        {/* Placeholder for Logos - in a real app, these would be SVGs */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
           {/* We'll use text placeholders for now as we don't have logo assets */}
           {["Acme Corp", "Global Tech", "Future Systems", "Innovate Inc"].map((name) => (
             <div 
               key={name} 
               className="trusted-logo"
               tabIndex={0}
             >
               {name}
             </div>
           ))}
        </motion.div>
      </div>
    </section>
  );
}
