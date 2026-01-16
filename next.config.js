const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig = {
    outputFileTracingRoot: __dirname,
    webpack: (config, { dev }) => {
        if (dev) config.cache = false;
        return config;
    },
};

const sentryWebpackPluginOptions = {
    authToken: process.env.SENTRY_AUTH_TOKEN,
    org: process.env.SENTRY_ORG || "talklee",
    project: process.env.SENTRY_PROJECT || "frontend",
    release: process.env.NEXT_PUBLIC_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_SHA,
    silent: true,
    dryRun: !process.env.SENTRY_AUTH_TOKEN,
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions, {
    silent: true,
    disableLogger: true,
});
