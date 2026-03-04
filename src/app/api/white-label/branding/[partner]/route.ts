import { NextResponse } from "next/server";
import { getWhiteLabelBranding } from "@/lib/white-label/branding";

type RouteContext = { params: Promise<{ partner: string }> };

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: RouteContext) {
    const { partner } = await ctx.params;
    const branding = getWhiteLabelBranding(partner);
    if (!branding) {
        return NextResponse.json({ error: "Unknown partner" }, { status: 404, headers: { "cache-control": "no-store" } });
    }

    return NextResponse.json(branding, { status: 200, headers: { "cache-control": "no-store" } });
}

