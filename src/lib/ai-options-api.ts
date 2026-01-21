// PROTOTYPE MODE - All APIs return dummy data

// Types
export interface ModelInfo {
    id: string;
    name: string;
    description: string;
    speed?: string;
    price?: string;
    context_window?: number;
    is_preview?: boolean;
}

export interface VoiceInfo {
    id: string;
    name: string;
    language: string;
    description: string;
    gender?: string;
    accent?: string;
    accent_color: string;
    preview_text: string;
    provider: string;
    tags: string[];
}

export interface ProviderListResponse {
    llm: {
        providers: string[];
        models: ModelInfo[];
    };
    stt: {
        providers: string[];
        models: ModelInfo[];
    };
    tts: {
        providers: string[];
        models: ModelInfo[];
    };
}

export interface AIProviderConfig {
    llm_provider: string;
    llm_model: string;
    llm_temperature: number;
    llm_max_tokens: number;
    stt_provider: string;
    stt_model: string;
    stt_language: string;
    tts_provider: string;
    tts_model: string;
    tts_voice_id: string;
    tts_sample_rate: number;
}

export interface LLMTestRequest {
    model: string;
    message: string;
    temperature?: number;
    max_tokens?: number;
}

export interface LLMTestResponse {
    response: string;
    latency_ms: number;
    first_token_ms: number;
    total_tokens: number;
    model: string;
}

export interface TTSTestRequest {
    model: string;
    voice_id: string;
    text: string;
    sample_rate?: number;
}

export interface TTSTestResponse {
    audio_base64: string;
    latency_ms: number;
    first_audio_ms: number;
    duration_seconds: number;
    model: string;
    voice_id: string;
}

export interface VoicePreviewRequest {
    voice_id: string;
    text?: string;
}

export interface VoicePreviewResponse {
    voice_id: string;
    voice_name: string;
    audio_base64: string;
    duration_seconds: number;
    latency_ms: number;
}

export interface LatencyBenchmarkResponse {
    llm_first_token_ms: number;
    llm_total_ms: number;
    tts_first_audio_ms: number;
    tts_total_ms: number;
    total_pipeline_ms: number;
}

// Default configuration
export const DEFAULT_CONFIG: AIProviderConfig = {
    llm_provider: "groq",
    llm_model: "llama-3.3-70b-versatile",
    llm_temperature: 0.6,
    llm_max_tokens: 150,
    stt_provider: "deepgram",
    stt_model: "nova-3",
    stt_language: "en",
    tts_provider: "cartesia",
    tts_model: "sonic-3",
    tts_voice_id: "f786b574-daa5-4673-aa0c-cbe3e8534c02",
    tts_sample_rate: 16000,
};

// Dummy data
const DUMMY_PROVIDERS: ProviderListResponse = {
    llm: {
        providers: ["groq", "openai", "anthropic"],
        models: [
            { id: "llama-3.3-70b-versatile", name: "LLaMA 3.3 70B", description: "Fast and versatile", speed: "Ultra-fast", price: "$0.0001/1K tokens" },
            { id: "gpt-4o", name: "GPT-4o", description: "Most capable", speed: "Fast", price: "$0.005/1K tokens" },
            { id: "claude-3-sonnet", name: "Claude 3 Sonnet", description: "Balanced performance", speed: "Fast", price: "$0.003/1K tokens" },
        ],
    },
    stt: {
        providers: ["deepgram", "whisper"],
        models: [
            { id: "nova-3", name: "Nova 3", description: "Latest and most accurate", speed: "Real-time" },
            { id: "nova-2", name: "Nova 2", description: "Proven reliability", speed: "Real-time" },
            { id: "whisper-large-v3", name: "Whisper Large V3", description: "OpenAI's best model", speed: "Near real-time" },
        ],
    },
    tts: {
        providers: ["cartesia", "elevenlabs", "google"],
        models: [
            { id: "sonic-3", name: "Sonic 3", description: "Ultra-low latency", speed: "< 100ms" },
            { id: "eleven-turbo-v2", name: "ElevenLabs Turbo V2", description: "High quality", speed: "< 200ms" },
            { id: "chirp-3-hd", name: "Chirp 3 HD", description: "Google's latest", speed: "< 150ms" },
        ],
    },
};

const DUMMY_VOICES: VoiceInfo[] = [
    {
        id: "f786b574-daa5-4673-aa0c-cbe3e8534c02",
        name: "Katie",
        language: "English",
        description: "Warm and professional female voice",
        gender: "Female",
        accent: "American",
        accent_color: "#4F46E5",
        preview_text: "Hello! I'm Katie, your AI assistant.",
        provider: "cartesia",
        tags: ["professional", "warm", "friendly"],
    },
    {
        id: "voice-002",
        name: "Marcus",
        language: "English",
        description: "Deep and authoritative male voice",
        gender: "Male",
        accent: "American",
        accent_color: "#059669",
        preview_text: "Hi there! I'm Marcus, ready to help.",
        provider: "cartesia",
        tags: ["authoritative", "deep", "confident"],
    },
    {
        id: "voice-003",
        name: "Sofia",
        language: "English",
        description: "Energetic and youthful female voice",
        gender: "Female",
        accent: "British",
        accent_color: "#DC2626",
        preview_text: "Hey! I'm Sofia, let's get started!",
        provider: "cartesia",
        tags: ["energetic", "youthful", "engaging"],
    },
    {
        id: "voice-004",
        name: "James",
        language: "English",
        description: "Calm and reassuring male voice",
        gender: "Male",
        accent: "British",
        accent_color: "#7C3AED",
        preview_text: "Good day! I'm James, how may I assist you?",
        provider: "elevenlabs",
        tags: ["calm", "reassuring", "sophisticated"],
    },
];

class AIOptionsApi {
    // Get available providers and models
    async getProviders(): Promise<ProviderListResponse> {
        return DUMMY_PROVIDERS;
    }

    // Get available TTS voices
    async getVoices(): Promise<VoiceInfo[]> {
        return DUMMY_VOICES;
    }

    // Preview a voice with sample audio
    async previewVoice(request: VoicePreviewRequest): Promise<VoicePreviewResponse> {
        const voice = DUMMY_VOICES.find(v => v.id === request.voice_id) || DUMMY_VOICES[0];
        return {
            voice_id: voice.id,
            voice_name: voice.name,
            audio_base64: "", // No actual audio in prototype
            duration_seconds: 2.5,
            latency_ms: 95,
        };
    }

    // Get current configuration
    async getConfig(): Promise<AIProviderConfig> {
        return DEFAULT_CONFIG;
    }

    // Save configuration
    async saveConfig(config: AIProviderConfig): Promise<AIProviderConfig> {
        return config;
    }

    // Test LLM with message
    async testLLM(request: LLMTestRequest): Promise<LLMTestResponse> {
        return {
            response: `This is a simulated response to: "${request.message}" (Prototype mode)`,
            latency_ms: 245,
            first_token_ms: 85,
            total_tokens: 42,
            model: request.model,
        };
    }

    // Test TTS with text
    async testTTS(request: TTSTestRequest): Promise<TTSTestResponse> {
        return {
            audio_base64: "", // No actual audio in prototype
            latency_ms: 120,
            first_audio_ms: 65,
            duration_seconds: 3.2,
            model: request.model,
            voice_id: request.voice_id,
        };
    }

    // Run full benchmark
    async runBenchmark(_config: AIProviderConfig): Promise<LatencyBenchmarkResponse> {
        void _config;
        return {
            llm_first_token_ms: 85,
            llm_total_ms: 340,
            tts_first_audio_ms: 65,
            tts_total_ms: 180,
            total_pipeline_ms: 520,
        };
    }
}

export const aiOptionsApi = new AIOptionsApi();
