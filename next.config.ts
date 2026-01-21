import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
    outputFileTracingRoot: process.cwd(),
    // allowedDevOrigins: ["http://127.0.0.1:3100"],
    webpack: (config, { dev }) => {
        if (dev) config.cache = false;
        return config;
    },
};

const authToken = process.env.SENTRY_AUTH_TOKEN;
const releaseName = process.env.NEXT_PUBLIC_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_SHA;

export default withSentryConfig(nextConfig, {
    authToken,
    org: process.env.SENTRY_ORG || "talklee",
    project: process.env.SENTRY_PROJECT || "frontend",
    silent: true,
    release: releaseName ? { name: releaseName } : undefined,
    bundleSizeOptimizations: {
        excludeDebugStatements: true,
    },
    sourcemaps: authToken ? undefined : { disable: true },
});
