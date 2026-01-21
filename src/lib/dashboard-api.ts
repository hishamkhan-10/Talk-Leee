// PROTOTYPE MODE - All APIs return dummy data

// Dashboard Types
export interface DashboardSummary {
    total_calls: number;
    answered_calls: number;
    failed_calls: number;
    minutes_used: number;
    minutes_remaining: number;
    active_campaigns: number;
}

// Campaign Types
export interface Campaign {
    id: string;
    name: string;
    description?: string;
    status: string;
    system_prompt: string;
    voice_id: string;
    max_concurrent_calls: number;
    total_leads: number;
    calls_completed: number;
    calls_failed: number;
    created_at: string;
    started_at?: string;
    completed_at?: string;
}

export interface CampaignCreate {
    name: string;
    description?: string;
    system_prompt: string;
    voice_id: string;
    goal?: string;
}

// Call Types
export interface Call {
    id: string;
    campaign_id: string;
    lead_id: string;
    phone_number: string;
    status: string;
    outcome?: string;
    duration_seconds?: number;
    transcript?: string;
    recording_url?: string;
    created_at: string;
    started_at?: string;
    ended_at?: string;
}

export interface CallDetail extends Call {
    summary?: string;
    recording_id?: string;
}

// Contact Types
export interface Contact {
    id: string;
    campaign_id: string;
    phone_number: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    status: string;
    last_call_result: string;
    call_attempts: number;
    created_at: string;
}

// DUMMY DATA
const DUMMY_SUMMARY: DashboardSummary = {
    total_calls: 1247,
    answered_calls: 1089,
    failed_calls: 158,
    minutes_used: 3420,
    minutes_remaining: 1580,
    active_campaigns: 3,
};

const DUMMY_CAMPAIGNS: Campaign[] = [
    {
        id: "camp-001",
        name: "Holiday Sales Outreach",
        description: "End of year promotional campaign for existing customers",
        status: "running",
        system_prompt: "You are a friendly sales representative...",
        voice_id: "voice-001",
        max_concurrent_calls: 10,
        total_leads: 500,
        calls_completed: 342,
        calls_failed: 45,
        created_at: "2024-12-15T10:00:00Z",
        started_at: "2024-12-16T09:00:00Z",
    },
    {
        id: "camp-002",
        name: "Customer Satisfaction Survey",
        description: "Post-purchase feedback collection",
        status: "paused",
        system_prompt: "You are conducting a brief customer satisfaction survey...",
        voice_id: "voice-002",
        max_concurrent_calls: 5,
        total_leads: 200,
        calls_completed: 87,
        calls_failed: 12,
        created_at: "2024-12-20T14:00:00Z",
        started_at: "2024-12-21T10:00:00Z",
    },
    {
        id: "camp-003",
        name: "New Product Launch",
        description: "Introducing our latest product line to premium customers",
        status: "draft",
        system_prompt: "You are introducing an exciting new product...",
        voice_id: "voice-003",
        max_concurrent_calls: 15,
        total_leads: 750,
        calls_completed: 0,
        calls_failed: 0,
        created_at: "2024-12-28T16:00:00Z",
    },
    {
        id: "camp-004",
        name: "Appointment Reminders",
        description: "Automated appointment reminder calls",
        status: "completed",
        system_prompt: "You are calling to remind about an upcoming appointment...",
        voice_id: "voice-001",
        max_concurrent_calls: 20,
        total_leads: 300,
        calls_completed: 285,
        calls_failed: 15,
        created_at: "2024-12-10T08:00:00Z",
        started_at: "2024-12-11T07:00:00Z",
        completed_at: "2024-12-12T18:00:00Z",
    },
];

const DUMMY_CALLS: Call[] = [
    {
        id: "call-001",
        campaign_id: "camp-001",
        lead_id: "lead-001",
        phone_number: "+1 (555) 123-4567",
        status: "completed",
        outcome: "interested",
        duration_seconds: 245,
        created_at: "2024-12-30T10:15:00Z",
        started_at: "2024-12-30T10:15:05Z",
        ended_at: "2024-12-30T10:19:10Z",
    },
    {
        id: "call-002",
        campaign_id: "camp-001",
        lead_id: "lead-002",
        phone_number: "+1 (555) 234-5678",
        status: "completed",
        outcome: "callback_requested",
        duration_seconds: 180,
        created_at: "2024-12-30T10:20:00Z",
        started_at: "2024-12-30T10:20:03Z",
        ended_at: "2024-12-30T10:23:03Z",
    },
    {
        id: "call-003",
        campaign_id: "camp-001",
        lead_id: "lead-003",
        phone_number: "+1 (555) 345-6789",
        status: "no_answer",
        duration_seconds: 0,
        created_at: "2024-12-30T10:25:00Z",
    },
    {
        id: "call-004",
        campaign_id: "camp-002",
        lead_id: "lead-004",
        phone_number: "+1 (555) 456-7890",
        status: "completed",
        outcome: "survey_completed",
        duration_seconds: 320,
        created_at: "2024-12-30T09:45:00Z",
        started_at: "2024-12-30T09:45:02Z",
        ended_at: "2024-12-30T09:50:22Z",
    },
    {
        id: "call-005",
        campaign_id: "camp-001",
        lead_id: "lead-005",
        phone_number: "+1 (555) 567-8901",
        status: "failed",
        outcome: "busy",
        duration_seconds: 0,
        created_at: "2024-12-30T10:30:00Z",
    },
    {
        id: "call-006",
        campaign_id: "camp-001",
        lead_id: "lead-006",
        phone_number: "+1 (555) 678-9012",
        status: "completed",
        outcome: "not_interested",
        duration_seconds: 95,
        created_at: "2024-12-30T10:35:00Z",
        started_at: "2024-12-30T10:35:04Z",
        ended_at: "2024-12-30T10:36:39Z",
    },
    {
        id: "call-007",
        campaign_id: "camp-002",
        lead_id: "lead-007",
        phone_number: "+1 (555) 789-0123",
        status: "in_progress",
        duration_seconds: 45,
        created_at: "2024-12-30T10:40:00Z",
        started_at: "2024-12-30T10:40:02Z",
    },
    {
        id: "call-008",
        campaign_id: "camp-001",
        lead_id: "lead-008",
        phone_number: "+1 (555) 890-1234",
        status: "completed",
        outcome: "voicemail",
        duration_seconds: 60,
        created_at: "2024-12-30T10:45:00Z",
        started_at: "2024-12-30T10:45:03Z",
        ended_at: "2024-12-30T10:46:03Z",
    },
];

const DUMMY_CONTACTS: Contact[] = [
    {
        id: "contact-001",
        campaign_id: "camp-001",
        phone_number: "+1 (555) 123-4567",
        first_name: "John",
        last_name: "Smith",
        email: "john.smith@email.com",
        status: "completed",
        last_call_result: "interested",
        call_attempts: 1,
        created_at: "2024-12-15T10:00:00Z",
    },
    {
        id: "contact-002",
        campaign_id: "camp-001",
        phone_number: "+1 (555) 234-5678",
        first_name: "Sarah",
        last_name: "Johnson",
        email: "sarah.j@email.com",
        status: "pending",
        last_call_result: "callback_requested",
        call_attempts: 1,
        created_at: "2024-12-15T10:00:00Z",
    },
    {
        id: "contact-003",
        campaign_id: "camp-001",
        phone_number: "+1 (555) 345-6789",
        first_name: "Michael",
        last_name: "Brown",
        email: "m.brown@email.com",
        status: "pending",
        last_call_result: "no_answer",
        call_attempts: 2,
        created_at: "2024-12-15T10:00:00Z",
    },
];

// Dashboard API with dummy data
class DashboardApi {
    // Dashboard
    async getDashboardSummary(): Promise<DashboardSummary> {
        return DUMMY_SUMMARY;
    }

    // Campaigns
    async listCampaigns(): Promise<{ campaigns: Campaign[] }> {
        return { campaigns: DUMMY_CAMPAIGNS };
    }

    async getCampaign(id: string): Promise<{ campaign: Campaign }> {
        const campaign = DUMMY_CAMPAIGNS.find(c => c.id === id) || DUMMY_CAMPAIGNS[0];
        return { campaign };
    }

    async createCampaign(data: CampaignCreate): Promise<{ campaign: Campaign }> {
        const newCampaign: Campaign = {
            id: `camp-${Date.now()}`,
            name: data.name,
            description: data.description,
            status: "draft",
            system_prompt: data.system_prompt,
            voice_id: data.voice_id,
            max_concurrent_calls: 10,
            total_leads: 0,
            calls_completed: 0,
            calls_failed: 0,
            created_at: new Date().toISOString(),
        };
        return { campaign: newCampaign };
    }

    async startCampaign(_id: string): Promise<{ message: string; jobs_enqueued: number }> {
        void _id;
        return { message: "Campaign started! (Prototype mode)", jobs_enqueued: 50 };
    }

    async pauseCampaign(_id: string): Promise<{ message: string }> {
        void _id;
        return { message: "Campaign paused! (Prototype mode)" };
    }

    async stopCampaign(_id: string): Promise<{ message: string }> {
        void _id;
        return { message: "Campaign stopped! (Prototype mode)" };
    }

    async getCampaignStats(_id: string): Promise<{
        campaign_id: string;
        campaign_status: string;
        total_leads: number;
        job_status_counts: Record<string, number>;
        call_outcome_counts: Record<string, number>;
        goals_achieved: number;
    }> {
        return {
            campaign_id: _id,
            campaign_status: "running",
            total_leads: 500,
            job_status_counts: { pending: 158, completed: 342 },
            call_outcome_counts: { interested: 120, callback_requested: 85, not_interested: 92, voicemail: 45 },
            goals_achieved: 120,
        };
    }

    // Contacts
    async listContacts(
        _campaignId: string,
        page: number = 1,
        pageSize: number = 50
    ): Promise<{ items: Contact[]; total: number; page: number; page_size: number }> {
        return {
            items: DUMMY_CONTACTS,
            total: DUMMY_CONTACTS.length,
            page,
            page_size: pageSize,
        };
    }

    async addContact(
        _campaignId: string,
        data: { phone_number: string; first_name?: string; last_name?: string; email?: string }
    ): Promise<{ message: string; contact: Contact }> {
        const newContact: Contact = {
            id: `contact-${Date.now()}`,
            campaign_id: _campaignId,
            phone_number: data.phone_number,
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            status: "pending",
            last_call_result: "none",
            call_attempts: 0,
            created_at: new Date().toISOString(),
        };
        return { message: "Contact added! (Prototype mode)", contact: newContact };
    }

    // Calls
    async listCalls(page: number = 1, pageSize: number = 20): Promise<{ calls: Call[]; total: number }> {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return {
            calls: DUMMY_CALLS.slice(start, end),
            total: DUMMY_CALLS.length,
        };
    }

    async getCall(id: string): Promise<CallDetail> {
        const call = DUMMY_CALLS.find(c => c.id === id) || DUMMY_CALLS[0];
        return {
            ...call,
            summary: "Customer expressed interest in the holiday promotion. Requested callback next week to discuss premium package options.",
            recording_id: `rec-${call.id}`,
        };
    }

    async getCallTranscript(_id: string, format: "json" | "text" = "json"): Promise<{
        format: string;
        turns?: Array<{ role: string; content: string; timestamp: string }>;
        transcript?: string;
        metadata?: Record<string, number>;
    }> {
        if (format === "json") {
            return {
                format: "json",
                turns: [
                    { role: "assistant", content: "Hello! This is Sarah from Talky AI. How are you doing today?", timestamp: "00:00:02" },
                    { role: "user", content: "Hi Sarah, I'm doing well, thank you!", timestamp: "00:00:08" },
                    { role: "assistant", content: "That's great to hear! I'm calling about our special holiday promotion. Do you have a moment to hear about it?", timestamp: "00:00:12" },
                    { role: "user", content: "Sure, I have a few minutes.", timestamp: "00:00:20" },
                    { role: "assistant", content: "Wonderful! We're offering 30% off on all premium packages until the end of the year...", timestamp: "00:00:24" },
                ],
                metadata: { total_turns: 5, duration_seconds: 245 },
            };
        }
        return {
            format: "text",
            transcript: "Assistant: Hello! This is Sarah from Talky AI...\nUser: Hi Sarah, I'm doing well...",
        };
    }
}

export const dashboardApi = new DashboardApi();
