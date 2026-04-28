"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
    aiOptionsApi,
    AIProviderConfig,
    ProviderListResponse,
    VoiceInfo,
    DEFAULT_CONFIG
} from "@/lib/ai-options-api";
import {
    Cpu,
    Volume2,
    Zap,
    Play,
    Send,
    RefreshCw,
    Check,
    AlertCircle,
    MessageSquare,
    Save
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LatencyMetrics {
    llm_first_token_ms?: number;
    llm_total_ms?: number;
    tts_first_audio_ms?: number;
    tts_total_ms?: number;
    total_pipeline_ms?: number;
}



export default function AIOptionsPage() {
    // State
    const [providers, setProviders] = useState<ProviderListResponse | null>(null);
    const [voices, setVoices] = useState<VoiceInfo[]>([]);
    const [config, setConfig] = useState<AIProviderConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Testing state
    const [testMessage, setTestMessage] = useState("");
    const [testResponse, setTestResponse] = useState("");
    const [testing, setTesting] = useState(false);
    const [latencyMetrics, setLatencyMetrics] = useState<LatencyMetrics>({});
    const [benchmarking, setBenchmarking] = useState(false);

    const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

    // TTS Provider filter state
    const [ttsProvider, setTtsProvider] = useState<"cartesia" | "google">("cartesia");




    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const models = providers?.llm.models ?? [];
        if (models.length === 0) return;
        const selected = config.llm_model;
        if (typeof selected === "string" && models.some((m) => m.id === selected)) return;
        setConfig((prev) => ({ ...prev, llm_model: models[0]!.id }));
    }, [config.llm_model, providers?.llm.models]);

    async function loadData() {
        try {
            setLoading(true);
            setError("");

            const [providersData, voicesData, configData] = await Promise.all([
                aiOptionsApi.getProviders(),
                aiOptionsApi.getVoices().catch(() => []), // Voices may fail if no API key
                aiOptionsApi.getConfig().catch(() => DEFAULT_CONFIG),
            ]);

            setProviders(providersData);
            setVoices(voicesData);
            setConfig(configData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load AI options");
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveConfig() {
        try {
            await aiOptionsApi.saveConfig(config);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save configuration");
        }
    }

    async function handleTestLLM() {
        if (!testMessage.trim()) return;

        try {
            setTesting(true);
            setError("");

            const response = await aiOptionsApi.testLLM({
                model: config.llm_model,
                message: testMessage,
                temperature: config.llm_temperature,
                max_tokens: config.llm_max_tokens,
            });

            setTestResponse(response.response);
            setLatencyMetrics(prev => ({
                ...prev,
                llm_first_token_ms: response.first_token_ms,
                llm_total_ms: response.latency_ms,
            }));
        } catch (err) {
            setError(err instanceof Error ? err.message : "LLM test failed");
        } finally {
            setTesting(false);
        }
    }

    // Preview a specific voice by ID (for individual voice cards)
    async function handlePreviewVoiceById(voiceId: string) {
        try {
            setPreviewingVoiceId(voiceId);
            setError("");

            const response = await aiOptionsApi.previewVoice({
                voice_id: voiceId,
                text: "Hello, I am your AI voice assistant. How can I help you today?",
            });

            // Play audio
            const audioData = atob(response.audio_base64);
            const audioArray = new Float32Array(audioData.length / 4);
            const dataView = new DataView(new ArrayBuffer(audioData.length));
            for (let i = 0; i < audioData.length; i++) {
                dataView.setUint8(i, audioData.charCodeAt(i));
            }
            for (let i = 0; i < audioArray.length; i++) {
                audioArray[i] = dataView.getFloat32(i * 4, true);
            }

            // Determine sample rate based on voice ID (Google Chirp 3 HD uses 24kHz, Cartesia uses 16kHz)
            const isGoogleVoice = voiceId.includes("Chirp3-HD");
            const sampleRate = isGoogleVoice ? 24000 : 16000;

            const audioContext = new AudioContext({ sampleRate });
            const audioBuffer = audioContext.createBuffer(1, audioArray.length, sampleRate);
            audioBuffer.getChannelData(0).set(audioArray);

            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start();

            source.onended = () => {
                audioContext.close();
                setPreviewingVoiceId(null);
            };
        } catch (err) {
            setError(err instanceof Error ? err.message : "Voice preview failed");
            setPreviewingVoiceId(null);
        }
    }
    async function handleRunBenchmark() {
        try {
            setBenchmarking(true);
            setError("");

            const result = await aiOptionsApi.runBenchmark(config);
            setLatencyMetrics(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Benchmark failed");
        } finally {
            setBenchmarking(false);
        }
    }



    return (
        <DashboardLayout title="AI Options" description="Configure LLM, STT, and TTS providers">
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Error Banner */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="content-card border-red-500/30 bg-red-500/10"
                            >
                                <div className="flex items-center gap-3 text-red-400">
                                    <AlertCircle className="w-5 h-5" />
                                    <span>{error}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Save Success Banner */}
                    <AnimatePresence>
                        {saveSuccess && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="content-card border-emerald-500/30 bg-emerald-500/10"
                            >
                                <div className="flex items-center gap-3 text-emerald-400">
                                    <Check className="w-5 h-5" />
                                    <span>Configuration saved successfully!</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Provider Selection Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* LLM Provider */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="content-card group"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-emerald-500/25 dark:bg-white/10 rounded-lg">
                                    <Cpu className="w-5 h-5 text-gray-900 dark:text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-gray-900 dark:group-hover:text-white">LLM Model</h3>
                                    <p className="text-sm text-gray-700 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-400">Groq AI</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    {(() => {
                                        const llmModels = providers?.llm.models ?? [];
                                        const hasModels = llmModels.length > 0;
                                        return (
                                            <>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-400 mb-2">Model</label>
                                    <select
                                        value={hasModels ? config.llm_model : ""}
                                        onChange={(e) => setConfig({ ...config, llm_model: e.target.value })}
                                        disabled={!hasModels}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white group-hover:text-gray-900 group-hover:bg-black/5 group-hover:border-black/10 dark:group-hover:text-white dark:group-hover:bg-white/5 dark:group-hover:border-white/10 focus:outline-none focus:border-purple-500/50"
                                    >
                                        {hasModels ? (
                                            llmModels.map((model) => (
                                                <option key={model.id} value={model.id}>
                                                    {model.name}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>
                                                No models available
                                            </option>
                                        )}
                                    </select>
                                    {!hasModels ? (
                                        <p className="mt-2 text-xs text-gray-700 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-400">
                                            No LLM models were returned from the API.
                                        </p>
                                    ) : null}
                                            </>
                                        );
                                    })()}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-400 mb-2">
                                        Temperature: {config.llm_temperature}
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="2"
                                        step="0.1"
                                        value={config.llm_temperature}
                                        onChange={(e) => setConfig({ ...config, llm_temperature: parseFloat(e.target.value) })}
                                        className="w-full accent-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-400 mb-2">
                                        Max Tokens: {config.llm_max_tokens}
                                    </label>
                                    <input
                                        type="range"
                                        min="50"
                                        max="500"
                                        step="10"
                                        value={config.llm_max_tokens}
                                        onChange={(e) => setConfig({ ...config, llm_max_tokens: parseInt(e.target.value) })}
                                        className="w-full accent-purple-500"
                                    />
                                </div>

                                {/* Model Info */}
                                {providers?.llm.models.find(m => m.id === config.llm_model) && (
                                    <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                        <p className="text-sm text-purple-300">
                                            {providers.llm.models.find(m => m.id === config.llm_model)?.description}
                                        </p>
                                        <p className="text-xs text-purple-400 mt-1">
                                            Speed: {providers.llm.models.find(m => m.id === config.llm_model)?.speed}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* TTS Provider - Voice Selection Cards */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="content-card group md:col-span-2"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/25 dark:bg-white/10 rounded-lg">
                                        <Volume2 className="w-5 h-5 text-gray-900 dark:text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-gray-900 dark:group-hover:text-white">TTS Voice ({voices.filter(v => v.provider === ttsProvider).length} available)</h3>
                                        <p className="text-sm text-gray-700 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-400">Select a voice for your AI agent</p>
                                    </div>
                                </div>

                                {/* Provider Selector */}
                                <div className="flex gap-2 p-1 bg-white/5 group-hover:bg-black/5 dark:group-hover:bg-white/5 rounded-lg border border-white/10 group-hover:border-black/10 dark:group-hover:border-white/10">
                                    <button
                                        onClick={() => setTtsProvider("cartesia")}
                                        className="px-4 py-2 rounded-md text-sm font-medium transition-all bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-lg shadow-teal-500/25 hover:scale-[1.02] active:scale-[0.99]"
                                    >
                                        Cartesia ({voices.filter(v => v.provider === "cartesia").length})
                                    </button>
                                    <button
                                        onClick={() => setTtsProvider("google")}
                                        className="px-4 py-2 rounded-md text-sm font-medium transition-all bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-lg shadow-teal-500/25 hover:scale-[1.02] active:scale-[0.99]"
                                    >
                                        Google ({voices.filter(v => v.provider === "google").length})
                                    </button>
                                </div>
                            </div>

                            {/* Voice Cards Grid - Filtered by Provider */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                                {voices
                                    .filter(voice => voice.provider === ttsProvider)
                                    .map((voice) => (
                                        <div
                                            key={voice.id}
                                            onClick={() => setConfig({
                                                ...config,
                                                tts_voice_id: voice.id,
                                                tts_provider: voice.provider === 'google' ? 'google' : 'cartesia',
                                                tts_sample_rate: voice.provider === 'google' ? 24000 : 16000
                                            })}
                                            className={`relative p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${config.tts_voice_id === voice.id
                                                ? "border-emerald-500 bg-emerald-500/20"
                                                : "border-white/20 bg-white/5 hover:bg-white/10 group-hover:border-black/10 group-hover:bg-black/5 group-hover:hover:bg-black/10 dark:group-hover:border-white/20 dark:group-hover:bg-white/5 dark:group-hover:hover:bg-white/10"
                                                }`}
                                        >
                                            {/* Play Preview Button */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePreviewVoiceById(voice.id);
                                                }}
                                                disabled={previewingVoiceId === voice.id}
                                                className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                                                style={{ backgroundColor: (voice.accent_color || "#10B981") + "30" }}
                                            >
                                                {previewingVoiceId === voice.id ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin" style={{ color: voice.accent_color || "#10B981" }} />
                                                ) : (
                                                    <Play className="w-4 h-4" style={{ color: voice.accent_color || "#10B981" }} />
                                                )}
                                            </button>

                                            {/* Voice Info */}
                                            <div className="pr-10">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-6 h-6 rounded-full flex items-center justify-center"
                                                        style={{ backgroundColor: (voice.accent_color || "#10B981") + "30" }}
                                                    >
                                                        <Volume2 className="w-3 h-3" style={{ color: voice.accent_color || "#10B981" }} />
                                                    </div>
                                                    <p className="font-medium text-sm text-gray-900 dark:text-white group-hover:text-gray-900 dark:group-hover:text-white">{voice.name}</p>
                                                </div>
                                                <p className="text-xs text-gray-700 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-400 mt-1 line-clamp-2">
                                                    {voice.description}
                                                </p>

                                                {/* Gender Tag */}
                                                <div className="mt-2 flex gap-1">
                                                    {voice.gender && (
                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${voice.gender === "female"
                                                            ? "bg-pink-500/20 text-pink-400"
                                                            : "bg-blue-500/20 text-blue-400"
                                                            }`}>
                                                            {voice.gender}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Selected Indicator */}
                                            {config.tts_voice_id === voice.id && (
                                                <div className="absolute bottom-2 right-2">
                                                    <Check className="w-4 h-4 text-emerald-400" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                            </div>

                            {/* Selected Voice Preview */}
                            {(() => {
                                const selectedVoice = voices.find(v => v.id === config.tts_voice_id);
                                if (!selectedVoice) return null;
                                return (
                                    <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                                style={{ backgroundColor: (selectedVoice.accent_color || "#10B981") + "40" }}
                                            >
                                                <Volume2 className="w-5 h-5" style={{ color: selectedVoice.accent_color || "#10B981" }} />
                                            </div>
                                            <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-gray-900 dark:group-hover:text-white">{selectedVoice.name}</p>
                                            <p className="text-xs text-gray-700 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-400">{selectedVoice.description}</p>
                                            </div>
                                            <button
                                                onClick={() => handlePreviewVoiceById(selectedVoice.id)}
                                                disabled={previewingVoiceId === selectedVoice.id}
                                            className="px-4 py-2 bg-emerald-500/30 hover:bg-emerald-500/40 rounded-lg text-emerald-400 hover:text-white text-sm flex items-center gap-2 transition-[transform,background-color,color] duration-150 ease-out hover:scale-[1.02] active:scale-[0.99]"
                                            >
                                                {previewingVoiceId === selectedVoice.id ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Play className="w-4 h-4" />
                                                )}
                                                <span>Preview Selected</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </motion.div>
                    </div>

                    {/* Latency Metrics */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="content-card group"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/25 dark:bg-white/10 rounded-lg">
                                    <Zap className="w-5 h-5 text-gray-900 dark:text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-gray-900 dark:group-hover:text-white">Latency Metrics</h3>
                                    <p className="text-sm text-gray-700 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-400">Real-time performance tracking</p>
                                </div>
                            </div>
                            <button
                                onClick={handleRunBenchmark}
                                disabled={benchmarking}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 rounded-lg text-white font-medium transition-all shadow-lg shadow-teal-500/25 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50"
                            >
                                {benchmarking ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Zap className="w-4 h-4" />
                                )}
                                <span>Run Benchmark</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="p-4 bg-white/5 group-hover:bg-black/5 dark:group-hover:bg-white/5 rounded-lg text-center transition-[transform,background-color,box-shadow] duration-150 ease-out hover:bg-white/10 group-hover:hover:bg-black/10 dark:group-hover:hover:bg-white/10 hover:scale-[1.02] hover:shadow-md">
                                <p className="text-2xl font-bold text-purple-400">
                                    {latencyMetrics.llm_first_token_ms?.toFixed(0) || "—"}
                                </p>
                                <p className="text-xs text-gray-700 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-400 mt-1">LLM First Token (ms)</p>
                            </div>
                            <div className="p-4 bg-white/5 group-hover:bg-black/5 dark:group-hover:bg-white/5 rounded-lg text-center transition-[transform,background-color,box-shadow] duration-150 ease-out hover:bg-white/10 group-hover:hover:bg-black/10 dark:group-hover:hover:bg-white/10 hover:scale-[1.02] hover:shadow-md">
                                <p className="text-2xl font-bold text-purple-400">
                                    {latencyMetrics.llm_total_ms?.toFixed(0) || "—"}
                                </p>
                                <p className="text-xs text-gray-700 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-400 mt-1">LLM Total (ms)</p>
                            </div>
                            <div className="p-4 bg-white/5 group-hover:bg-black/5 dark:group-hover:bg-white/5 rounded-lg text-center transition-[transform,background-color,box-shadow] duration-150 ease-out hover:bg-white/10 group-hover:hover:bg-black/10 dark:group-hover:hover:bg-white/10 hover:scale-[1.02] hover:shadow-md">
                                <p className="text-2xl font-bold text-emerald-400">
                                    {latencyMetrics.tts_first_audio_ms?.toFixed(0) || "—"}
                                </p>
                                <p className="text-xs text-gray-700 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-400 mt-1">TTS First Audio (ms)</p>
                            </div>
                            <div className="p-4 bg-white/5 group-hover:bg-black/5 dark:group-hover:bg-white/5 rounded-lg text-center transition-[transform,background-color,box-shadow] duration-150 ease-out hover:bg-white/10 group-hover:hover:bg-black/10 dark:group-hover:hover:bg-white/10 hover:scale-[1.02] hover:shadow-md">
                                <p className="text-2xl font-bold text-emerald-400">
                                    {latencyMetrics.tts_total_ms?.toFixed(0) || "—"}
                                </p>
                                <p className="text-xs text-gray-700 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-400 mt-1">TTS Total (ms)</p>
                            </div>
                            <div className="p-4 bg-white/5 group-hover:bg-black/5 dark:group-hover:bg-white/5 rounded-lg text-center transition-[transform,background-color,box-shadow] duration-150 ease-out hover:bg-white/10 group-hover:hover:bg-black/10 dark:group-hover:hover:bg-white/10 hover:scale-[1.02] hover:shadow-md">
                                <p className="text-2xl font-bold text-yellow-400">
                                    {latencyMetrics.total_pipeline_ms?.toFixed(0) || "—"}
                                </p>
                                <p className="text-xs text-gray-700 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-400 mt-1">Total Pipeline (ms)</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* LLM Test Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="content-card group"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-500/25 dark:bg-white/10 rounded-lg">
                                <MessageSquare className="w-5 h-5 text-gray-900 dark:text-white group-hover:text-gray-900 dark:group-hover:text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-gray-900 dark:group-hover:text-white">Test LLM</h3>
                                <p className="text-sm text-gray-700 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-400">Send a message to test the selected model</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    value={testMessage}
                                    onChange={(e) => setTestMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleTestLLM()}
                                    placeholder="Type a message to test the LLM..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white group-hover:text-gray-900 group-hover:bg-black/5 group-hover:border-black/10 dark:group-hover:text-white dark:group-hover:bg-white/5 dark:group-hover:border-white/10 placeholder-gray-500 transition-[background-color,border-color,color] duration-150 ease-out hover:bg-white/10 group-hover:hover:bg-black/10 dark:group-hover:hover:bg-white/10 hover:border-white/20 focus:outline-none focus:border-purple-500/50"
                                />
                                <button
                                    onClick={handleTestLLM}
                                    disabled={testing || !testMessage.trim()}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 rounded-lg text-white font-medium transition-all shadow-lg shadow-teal-500/25 hover:scale-[1.02] active:scale-[0.99]"
                                >
                                    {testing ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    <span>Send</span>
                                </button>
                            </div>

                            {testResponse && (
                                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                    <p className="text-sm text-gray-900 dark:text-gray-300 whitespace-pre-wrap">{testResponse}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Save Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex justify-end"
                    >
                        <button
                            onClick={handleSaveConfig}
                            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 rounded-lg text-white font-medium transition-all shadow-lg shadow-teal-500/25 hover:scale-[1.02] active:scale-[0.99]"
                        >
                            <Save className="w-5 h-5" />
                            <span>Save Configuration</span>
                        </button>
                    </motion.div>
                </div>
            )}
        </DashboardLayout>
    );
}
