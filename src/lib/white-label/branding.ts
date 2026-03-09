export type WhiteLabelBranding = {
    partnerId: string;
    displayName: string;
    logo: {
        src: string;
        alt: string;
        width: number;
        height: number;
    };
    features: {
        callTransfer: boolean;
    };
    colors: {
        primary: string;
        secondary: string;
    };
    favicon: {
        src: string;
        type?: string;
    };
    version: string;
};

const PROFILES: Record<string, WhiteLabelBranding> = {
    acme: {
        partnerId: "acme",
        displayName: "Acme",
        logo: { src: "/white-label/acme/logo.svg", alt: "Acme", width: 28, height: 28 },
        features: { callTransfer: true },
        colors: { primary: "#2563EB", secondary: "#DBEAFE" },
        favicon: { src: "/white-label/acme/favicon.svg", type: "image/svg+xml" },
        version: "2026-03-04-acme-1",
    },
    zen: {
        partnerId: "zen",
        displayName: "Zen",
        logo: { src: "/white-label/zen/logo.svg", alt: "Zen", width: 28, height: 28 },
        features: { callTransfer: false },
        colors: { primary: "#16A34A", secondary: "#DCFCE7" },
        favicon: { src: "/white-label/zen/favicon.svg", type: "image/svg+xml" },
        version: "2026-03-04-zen-1",
    },
};

export function getWhiteLabelBranding(partnerId: string): WhiteLabelBranding | null {
    const key = partnerId.trim().toLowerCase();
    return PROFILES[key] ?? null;
}

export function listWhiteLabelPartners(): string[] {
    return Object.keys(PROFILES).sort();
}
