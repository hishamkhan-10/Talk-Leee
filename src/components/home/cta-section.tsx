"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-24 px-4 md:px-6 lg:px-8 bg-indigo-600 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl bg-indigo-500/30 backdrop-blur-sm border border-indigo-400/30 p-12 md:p-20 text-center overflow-hidden"
        >
          {/* Decorative background effects */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-400/20 rounded-full blur-3xl" />
          </div>

          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Ready to Transform Your
            <br />
            Communications?
          </h2>
          
          <p className="text-lg md:text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Start your free trial today and experience the future of AI voice calling.
          </p>

          <Link href="/auth/register">
            <Button 
              size="lg" 
              className="bg-white text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-full px-8 h-14 text-base font-bold shadow-xl transition-all hover:scale-105 hover:shadow-2xl group"
            >
              Get Started Now
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
