"use client";

import type React from "react";
import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { MagneticText } from "./morphing-cursor";
import { apiBaseUrl } from "@/lib/env";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, MessageCircle } from "lucide-react";
import { TrustedByMarquee } from "../home/trusted-by-section";

type AIState = "idle" | "connecting" | "browsing" | "listening" | "processing" | "speaking";

interface VoiceAgent {
    id: string;
    name: string;
    gender: string;
    description: string;
}

const VOICE_AGENTS: VoiceAgent[] = [
    { id: "sophia", name: "Sophia", gender: "female", description: "Warm & Professional" },
    { id: "emma", name: "Emma", gender: "female", description: "Energetic & Friendly" },
    { id: "alex", name: "Alex", gender: "male", description: "Confident & Clear" },
];

const AudioVisualizer: React.FC<{ isActive: boolean; audioLevel: number }> = ({ isActive, audioLevel }) => {
    const [time, setTime] = useState(0);

    useEffect(() => {
        if (!isActive) return;
        let rafId = 0;
        const tick = (t: number) => {
            setTime(t);
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [isActive]);

    if (!isActive) return null;

    return (
        <div className="flex items-end justify-center gap-1 h-5 mt-1">
            {[...Array(5)].map((_, i) => (
                <div
                    key={i}
                    className="w-1 rounded-full transition-all duration-75"
                    style={{
                        height: `${Math.max(3, 6 + audioLevel * 12 + Math.sin(time / 120 + i) * (2 + audioLevel * 2))}px`,
                        background: `linear-gradient(to top, #6366f1, #818cf8, #a5b4fc)`,
                        opacity: 0.8 + audioLevel * 0.2,
                    }}
                />
            ))}
        </div>
    );
};

interface HeroProps {
    title: string;
    description: string | string[];
    stats?: Array<{ label: string; value: string }>;
    adjustForNavbar?: boolean;
}

export const Hero: React.FC<HeroProps> = ({ title, description, stats, adjustForNavbar = false }) => {
    const [aiState, setAiState] = useState<AIState>("idle");
    const [audioLevel, setAudioLevel] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);
    const [currentVoiceName, setCurrentVoiceName] = useState("");
    const [voiceSelected, setVoiceSelected] = useState(false);
    const [hasSwiped, setHasSwiped] = useState(false);

    const sectionRef = useRef<HTMLElement | null>(null);
    const heroContentRef = useRef<HTMLDivElement | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioQueueRef = useRef<ArrayBuffer[]>([]);
    const isPlayingRef = useRef(false);
    const playNextAudioChunkRef = useRef<(() => void) | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    const micAudioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    const selectedVoice = VOICE_AGENTS[selectedVoiceIndex];
    const isActive = aiState !== "idle";
    const titleParts = title.split(/\s+/).filter(Boolean);
    const headlineA = (titleParts[0] || "AI").toUpperCase();
    const headlineB = (titleParts.slice(1).join(" ") || "DIALER").toUpperCase();
    const descriptionParagraphs = useMemo(() => {
        const paragraphs = Array.isArray(description) ? description : [description];
        return paragraphs
            .map((text) => text.replace(/\s+/g, " ").trim())
            .filter(Boolean);
    }, [description]);
    const descriptionSizerParagraph = useMemo(() => {
        let longest = "";
        for (const paragraph of descriptionParagraphs) {
            if (paragraph.length > longest.length) longest = paragraph;
        }
        return longest;
    }, [descriptionParagraphs]);
    const [descriptionIndex, setDescriptionIndex] = useState(0);
    const [descriptionRenderId, setDescriptionRenderId] = useState(0);
    const [typedChars, setTypedChars] = useState(0);
    const activeParagraph = descriptionParagraphs[descriptionIndex] ?? "";

    useEffect(() => {
        setDescriptionIndex((prev) => {
            const max = Math.max(0, descriptionParagraphs.length - 1);
            return Math.min(prev, max);
        });
    }, [descriptionParagraphs.length]);

    useEffect(() => {
        const fullText = activeParagraph;
        setTypedChars(0);
        if (!fullText) return;

        const targetTotalMs = descriptionParagraphs.length > 1 ? 5200 : 2600;
        const basePerCharMs = Math.max(16, Math.min(38, Math.round(targetTotalMs / Math.max(1, fullText.length))));
        const startDelayMs = 200;

        let index = 0;
        let timeoutId = 0;

        const tick = () => {
            index += 1;
            setTypedChars(index);
            if (index >= fullText.length) return;

            const justTyped = fullText[index - 1] ?? "";
            const isSpace = justTyped === " ";
            const isPunct = /[.,!?;:]/.test(justTyped);
            const delay = basePerCharMs + (isSpace ? 70 : 0) + (isPunct ? 160 : 0);
            timeoutId = window.setTimeout(tick, delay);
        };

        timeoutId = window.setTimeout(tick, startDelayMs);
        return () => {
            if (timeoutId) window.clearTimeout(timeoutId);
        };
    }, [activeParagraph, descriptionRenderId, descriptionParagraphs.length]);

    useEffect(() => {
        if (!activeParagraph) return;
        if (typedChars < activeParagraph.length) return;

        const holdMs = descriptionParagraphs.length > 1 ? 900 : 1400;
        const timeoutId = window.setTimeout(() => {
            setDescriptionRenderId((prev) => prev + 1);
            setDescriptionIndex((prev) => {
                const total = Math.max(1, descriptionParagraphs.length);
                return (prev + 1) % total;
            });
        }, holdMs);

        return () => window.clearTimeout(timeoutId);
    }, [activeParagraph, typedChars, descriptionParagraphs.length]);

    const playNextAudioChunk = useCallback(async () => {
        // Start IMMEDIATELY with first chunk - no pre-buffering delay
        // Backend sends small first chunk (~100ms) for instant audio start
        if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
        isPlayingRef.current = true;

        try {
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new AudioContext({ sampleRate: 16000 });
            }
            const ctx = audioContextRef.current;
            const buffer = audioQueueRef.current.shift();

            if (buffer) {
                const float32Data = new Float32Array(buffer.byteLength / 4);
                const view = new DataView(buffer);
                for (let i = 0; i < float32Data.length; i++) {
                    float32Data[i] = view.getFloat32(i * 4, true);
                }
                const audioBuffer = ctx.createBuffer(1, float32Data.length, 16000);
                audioBuffer.getChannelData(0).set(float32Data);

                // Create analyser for output audio visualization
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 256;

                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(analyser);
                analyser.connect(ctx.destination);
                source.start();

                // Track output audio level while playing
                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                const trackOutputLevel = () => {
                    if (isPlayingRef.current) {
                        analyser.getByteFrequencyData(dataArray);
                        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                        setAudioLevel(Math.min(1, average / 100));
                        requestAnimationFrame(trackOutputLevel);
                    }
                };
                trackOutputLevel();

                source.onended = () => {
                    isPlayingRef.current = false;
                    setAudioLevel(0); // Reset level when chunk ends
                    playNextAudioChunkRef.current?.();
                };
            } else {
                isPlayingRef.current = false;
            }
        } catch {
            isPlayingRef.current = false;
        }
    }, []);

    useEffect(() => {
        playNextAudioChunkRef.current = () => {
            void playNextAudioChunk();
        };
    }, [playNextAudioChunk]);

    const startMicrophone = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
            });
            micStreamRef.current = stream;

            const audioContext = new AudioContext({ sampleRate: 16000 });
            micAudioContextRef.current = audioContext;
            const source = audioContext.createMediaStreamSource(stream);

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const updateLevel = () => {
                if (analyserRef.current) {
                    analyserRef.current.getByteFrequencyData(dataArray);
                    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                    setAudioLevel(Math.min(1, average / 128));
                    animationFrameRef.current = requestAnimationFrame(updateLevel);
                }
            };
            updateLevel();

            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (event) => {
                if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
                const inputData = event.inputBuffer.getChannelData(0);
                const pcmData = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i]));
                    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                wsRef.current.send(pcmData.buffer);
            };

            source.connect(processor);
            processor.connect(audioContext.destination);
        } catch {
            setError("Microphone access denied");
        }
    }, []);

    const stopMicrophone = useCallback(() => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
        if (micAudioContextRef.current) { micAudioContextRef.current.close(); micAudioContextRef.current = null; }
        if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(track => track.stop()); micStreamRef.current = null; }
        analyserRef.current = null;
        setAudioLevel(0);
    }, []);

    const handleMessage = useCallback(async (event: MessageEvent) => {
        if (event.data instanceof Blob) {
            const arrayBuffer = await event.data.arrayBuffer();
            audioQueueRef.current.push(arrayBuffer);
            setAiState("speaking");
            playNextAudioChunkRef.current?.();
        } else {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case "ready":
                    setAiState("browsing");
                    setCurrentVoiceName(data.agent_name);
                    break;
                case "voice_switched":
                    setCurrentVoiceName(data.agent_name);
                    break;
                case "transcript":
                    if (data.is_final && data.text) setAiState("processing");
                    break;
                case "llm_response":
                    setAiState("speaking");
                    break;
                case "turn_complete":
                    if (voiceSelected) {
                        setAiState("listening");
                    } else {
                        setAiState("browsing");
                    }
                    break;
                case "barge_in":
                case "tts_interrupted":
                    audioQueueRef.current = [];
                    isPlayingRef.current = false;
                    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
                    if (voiceSelected) setAiState("listening");
                    break;
                case "error":
                    setError(data.message);
                    break;
            }
        }
    }, [voiceSelected]);

    const endSession = useCallback(() => {
        stopMicrophone();
        if (wsRef.current) {
            try { wsRef.current.send(JSON.stringify({ type: "end_call" })); } catch { /* ignore */ }
            wsRef.current.close();
            wsRef.current = null;
        }
        if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        setAiState("idle");
        setAudioLevel(0);
        setCurrentVoiceName("");
        setHasSwiped(false);
        setVoiceSelected(false);
    }, [stopMicrophone]);

    const startSession = useCallback(() => {
        setAiState("connecting");
        setError(null);
        setHasSwiped(false);
        setVoiceSelected(false);
        const sessionId = `ask-ai-${Date.now()}`;
        const apiUrl = apiBaseUrl();
        const u = new URL(apiUrl);
        u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
        u.pathname = `${u.pathname.replace(/\/$/, "")}/ws/ai-test/${sessionId}`;
        const ws = new WebSocket(u.toString());
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: "config", voice_id: selectedVoice.id }));
        };
        ws.onmessage = handleMessage;
        ws.onerror = () => { setError("Connection error"); endSession(); };
        ws.onclose = () => { if (aiState !== "idle") endSession(); };
    }, [handleMessage, selectedVoice.id, aiState, endSession]);

    const selectVoice = useCallback(() => {
        setVoiceSelected(true);
        setAiState("listening");
        startMicrophone();
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "voice_selected", voice_id: selectedVoice.id }));
        }
    }, [selectedVoice.id, startMicrophone]);

    const switchVoice = useCallback((direction: 'prev' | 'next') => {
        if (!hasSwiped) setHasSwiped(true);

        const newIndex = direction === 'next'
            ? (selectedVoiceIndex + 1) % VOICE_AGENTS.length
            : (selectedVoiceIndex - 1 + VOICE_AGENTS.length) % VOICE_AGENTS.length;
        setSelectedVoiceIndex(newIndex);

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            audioQueueRef.current = [];
            isPlayingRef.current = false;
            if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
            wsRef.current.send(JSON.stringify({ type: "switch_voice", voice_id: VOICE_AGENTS[newIndex].id }));
        }
    }, [selectedVoiceIndex, hasSwiped]);

    const handleMainButtonClick = useCallback(() => {
        if (aiState === "idle") {
            startSession();
        } else if (aiState === "browsing" || aiState === "speaking") {
            selectVoice();
        } else {
            endSession();
        }
    }, [aiState, startSession, selectVoice, endSession]);

    useEffect(() => {
        return () => {
            stopMicrophone();
            if (wsRef.current) wsRef.current.close();
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, [stopMicrophone]);

    const getStatusText = () => {
        switch (aiState) {
            case "connecting": return "Connecting...";
            case "browsing": return "Tap to select";
            case "listening": return "Listening...";
            case "processing": return "Thinking...";
            case "speaking": return voiceSelected ? "Speaking..." : "Tap to select";
            default: return "Click to talk";
        }
    };

    const showSwipeArrows = isActive && !voiceSelected;
    const heroHeightClass = adjustForNavbar ? "h-[calc(100vh-var(--home-navbar-height))]" : "h-screen";

    return (
        <section
            ref={sectionRef}
            className={`relative ${heroHeightClass} w-full font-sans tracking-tight text-foreground bg-transparent overflow-hidden select-none`}
        >
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 heroAnimatedGradientBase" />
                <div className="absolute -inset-[30%] heroAnimatedGradientBlobs" />
                <div className="absolute inset-0 heroAnimatedGradientVignette" />
            </div>

            <motion.div
                whileHover={{ scale: 1.04, y: -2 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-auto absolute top-6 md:top-8 left-1/2 -translate-x-1/2 z-30 flex max-w-[calc(100vw-2rem)] flex-wrap items-center justify-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-muted/60 border border-border text-xs md:text-sm font-medium text-muted-foreground text-center"
            >
                <CheckCircle className="w-4 h-4 text-foreground" />
                <span>Trusted by 10,000+ businesses worldwide</span>
            </motion.div>

            <div
                className="pointer-events-auto fixed bottom-5 right-2 sm:bottom-6 sm:right-3 z-50 flex items-center gap-2"
            >
                {/* Left Arrow */}
                {showSwipeArrows && hasSwiped && (
                    <button
                        onClick={() => switchVoice('prev')}
                        className="w-10 h-10 rounded-full bg-background/85 hover:bg-background border border-border/70 flex items-center justify-center text-primary hover:text-primary/90 dark:text-foreground dark:hover:text-foreground/90 transition-[background-color,border-color,box-shadow,transform,color] duration-200 ease-out shadow-md hover:shadow-lg hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                )}

                {/* Main Circle Button */}
                <button
                    onClick={handleMainButtonClick}
                    className={`relative rounded-full transition-[background-color,border-color,box-shadow,transform] duration-500 ease-out cursor-pointer group overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${!isActive
                        ? "stats-card inline-flex items-center justify-center h-10 w-10 px-0 bg-cyan-50/70 border border-cyan-200/80 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] backdrop-blur-sm transition-[background-color,border-color,box-shadow,transform,width,padding] hover:scale-105 md:justify-start md:gap-2 md:px-3 md:w-[150px] dark:bg-cyan-950/60 dark:border-cyan-200/35 dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.55),0_0_0_1px_rgba(34,211,238,0.16),0_0_24px_rgba(34,211,238,0.14)]"
                        : "flex flex-col items-center justify-center w-40 h-40 bg-background/70 border-2 border-indigo-400/40 backdrop-blur-md"
                        }`}
                    style={{
                        boxShadow: isActive
                            ? `0 0 40px rgba(99, 102, 241, ${0.2 + audioLevel * 0.2}), 0 0 80px rgba(129, 140, 248, ${0.1 + audioLevel * 0.15})`
                            : undefined,
                    }}
                >
                    {isActive && (
                        <div className="absolute inset-0 rounded-full border-2 border-indigo-400/30" style={{ animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite" }} />
                    )}

                    {!isActive ? (
                        <div className="relative z-10 flex items-center gap-2">
                            <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]">
                                <MessageCircle className="h-4 w-4 text-white" />
                                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-white/90" />
                            </span>
                            <div className="hidden md:flex flex-col items-start leading-tight">
                                <h3 className="text-sm font-semibold leading-none text-primary dark:text-white">Ask AI</h3>
                                <p className="text-[10px] leading-none text-primary/80 dark:text-white/80">{getStatusText()}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center z-10">
                            <div className="text-2xl font-bold text-primary dark:text-foreground mb-0.5">
                                {currentVoiceName || selectedVoice.name}
                            </div>
                            <div className="text-xs text-primary/80 dark:text-foreground/80 mb-1">{selectedVoice.description}</div>
                            <AudioVisualizer isActive={voiceSelected && (aiState === "listening" || aiState === "speaking")} audioLevel={audioLevel} />
                            <p className="text-[10px] text-primary/70 dark:text-foreground/70 mt-1">{getStatusText()}</p>
                        </div>
                    )}
                </button>

                {/* Right Arrow */}
                {showSwipeArrows && (
                    <button
                        onClick={() => switchVoice('next')}
                        className="w-10 h-10 rounded-full bg-background/85 hover:bg-background border border-border/70 flex items-center justify-center text-primary hover:text-primary/90 dark:text-foreground dark:hover:text-foreground/90 transition-[background-color,border-color,box-shadow,transform,color] duration-200 ease-out shadow-md hover:shadow-lg hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                )}

                {error && <p className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-xs text-red-500 whitespace-nowrap">{error}</p>}
            </div>

            <div className="pointer-events-auto absolute bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-[720px]">
                <TrustedByMarquee />
            </div>

            {/* Hero content */}
            <div ref={heroContentRef} className="absolute inset-0 z-10 flex items-center justify-center px-4 md:px-16">
                <div className="w-full max-w-4xl text-center">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: {},
                            visible: {
                                transition: { staggerChildren: 0.14, delayChildren: 0.05 },
                            },
                        }}
                        className="flex flex-col items-center gap-2 mb-6"
                    >
                        <div className="md:hidden">
                            <motion.div
                                variants={{
                                    hidden: { opacity: 0, x: 0 },
                                    visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 140, damping: 18 } },
                                }}
                                className="text-5xl font-bold tracking-tighter text-primary dark:text-foreground leading-none"
                            >
                                {headlineA}
                            </motion.div>
                            <motion.div
                                variants={{
                                    hidden: { opacity: 0, x: 0 },
                                    visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 140, damping: 18 } },
                                }}
                                className="mt-2 text-4xl font-bold tracking-tighter text-primary dark:text-foreground leading-none break-words"
                            >
                                {headlineB}
                            </motion.div>
                        </div>
                        <div className="hidden md:block">
                            <motion.div
                                variants={{
                                    hidden: { opacity: 0, x: 0 },
                                    visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 140, damping: 18 } },
                                }}
                            >
                                <MagneticText text={headlineA} hoverText={headlineA} className="mx-auto [&_span]:text-5xl md:[&_span]:text-7xl" />
                            </motion.div>
                            <motion.div
                                variants={{
                                    hidden: { opacity: 0, x: 0 },
                                    visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 140, damping: 18 } },
                                }}
                                className="mt-3"
                            >
                                <MagneticText text={headlineB} hoverText={headlineB} className="mx-auto [&_span]:text-5xl md:[&_span]:text-7xl" />
                            </motion.div>
                        </div>
                    </motion.div>

                    <div className="mb-8 max-w-2xl mx-auto">
                        <div className="relative">
                            <p className="invisible pointer-events-none text-muted-foreground text-base md:text-lg leading-relaxed font-light tracking-tight whitespace-pre-line break-words max-w-full">
                                {descriptionSizerParagraph}
                            </p>
                            <div className="absolute inset-0">
                                <AnimatePresence mode="wait">
                                    <motion.p
                                        key={descriptionRenderId}
                                        initial={{ opacity: 0, x: 28 }}
                                        animate={{ opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }}
                                        exit={{ opacity: 0, x: -28, transition: { duration: 0.5, ease: "easeIn" } }}
                                        className="text-muted-foreground text-base md:text-lg leading-relaxed font-light tracking-tight whitespace-pre-line break-words max-w-full w-full"
                                    >
                                        {activeParagraph.slice(0, typedChars)}
                                    </motion.p>
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                    {stats && stats.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-8">
                            {stats.map((stat, index) => (
                                <div key={index} className="text-center">
                                    <div className="text-3xl md:text-4xl font-semibold text-primary dark:text-foreground">{stat.value}</div>
                                    <div className="text-sm text-muted-foreground uppercase tracking-wide mt-1">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes ping {
                    75%, 100% { transform: scale(1.15); opacity: 0; }
                }
                .heroAnimatedGradientBase {
                    background: var(--home-gradient-base);
                    background-size: 200% 200%;
                    animation: heroGradientShift 14s ease-in-out infinite;
                    filter: saturate(1.1);
                }
                .heroAnimatedGradientBlobs {
                    background: var(--home-gradient-blobs);
                    filter: blur(28px) saturate(1.15);
                    animation: heroBlobFloat 10s ease-in-out infinite;
                    transform: translate3d(0, 0, 0);
                    will-change: transform;
                }
                .heroAnimatedGradientVignette {
                    background: var(--home-gradient-vignette);
                    pointer-events: none;
                }
                @keyframes heroGradientShift {
                    0% { background-position: 0% 40%; }
                    50% { background-position: 100% 60%; }
                    100% { background-position: 0% 40%; }
                }
                @keyframes heroBlobFloat {
                    0% { transform: translate3d(-2%, -1%, 0) scale(1); }
                    33% { transform: translate3d(2%, -3%, 0) scale(1.04); }
                    66% { transform: translate3d(-1%, 2%, 0) scale(1.02); }
                    100% { transform: translate3d(-2%, -1%, 0) scale(1); }
                }
                @media (prefers-reduced-motion: reduce) {
                    .heroAnimatedGradientBase,
                    .heroAnimatedGradientBlobs {
                        animation: none;
                    }
                }
            `}</style>
        </section>
    );
};

export type { AIState };
export default Hero;
