"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/home/navbar";
import { Footer } from "@/components/home/footer";
import { motion } from "framer-motion";
import { Play, Pause, Loader2 } from "lucide-react";
import type { Voice } from "@/app/api/voices/route";

export default function AiVoicesPage() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch("/api/voices");
        if (!response.ok) {
          throw new Error("Failed to fetch voices");
        }
        const data = await response.json();
        setVoices(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchVoices();
  }, []);

  const handlePreview = (voiceId: string) => {
    if (playingId === voiceId) {
      setPlayingId(null);
      // Logic to stop audio would go here
    } else {
      setPlayingId(voiceId);
      // Logic to play audio would go here
      // Auto-stop after 3 seconds for demo
      setTimeout(() => {
        setPlayingId((prev) => (prev === voiceId ? null : prev));
      }, 3000);
    }
  };

  return (
    <main className="min-h-screen bg-background home-navbar-offset">
      <Navbar />
      
      <div className="pt-10 md:pt-6 pb-24 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-foreground tracking-tight"
          >
            AI Voices
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground"
          >
            Choose from our library of natural, human-like AI voices
          </motion.p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20" role="status" aria-live="polite" aria-busy="true">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" aria-hidden />
            <span className="sr-only">Loading voices…</span>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-600" role="alert" aria-live="assertive">
            <p>Error: {error}</p>
            <button 
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {voices.map((voice, index) => (
              <motion.div
                key={voice.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group p-8 rounded-2xl border border-border bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center"
              >
                <div className={`w-20 h-20 rounded-full ${voice.bg} ${voice.color} flex items-center justify-center mb-6 text-3xl font-bold group-hover:scale-110 transition-transform duration-300`}>
                  {voice.initial}
                </div>
                
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {voice.name}
                </h3>
                
                <p className="text-muted-foreground mb-8 min-h-[3rem]">
                  {voice.description}
                </p>
                
                <button
                  type="button"
                  onClick={() => handlePreview(voice.id)}
                  className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center gap-2"
                  aria-label={`Preview voice of ${voice.name}`}
                  aria-pressed={playingId === voice.id}
                >
                  {playingId === voice.id ? (
                    <>
                      <Pause className="w-4 h-4" aria-hidden /> Stop Preview
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" aria-hidden /> Preview Voice
                    </>
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
