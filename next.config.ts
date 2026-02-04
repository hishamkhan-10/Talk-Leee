import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
    outputFileTracingRoot: process.cwd(),
    // allowedDevOrigins: ["http://127.0.0.1:3100"],
};

const authToken = process.env.SENTRY_AUTH_TOKEN;
const releaseName = process.env.NEXT_PUBLIC_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_SHA;

export default withSentryConfig(
    nextConfig,
    {
        authToken,
        org: authToken ? process.env.SENTRY_ORG : undefined,
        project: authToken ? process.env.SENTRY_PROJECT : undefined,
        silent: true,
        disableLogger: true,
        release: authToken && releaseName ? { name: releaseName } : undefined,
        bundleSizeOptimizations: {
            excludeDebugStatements: true,
        },
        sourcemaps: authToken ? undefined : { disable: true },
    }
);
