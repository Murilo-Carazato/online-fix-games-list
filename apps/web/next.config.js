/** @type {import('next').NextConfig} */
const withPWA = require("@ducanh2912/next-pwa").default({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
    // Enable transpiling of internal monorepo packages
    transpilePackages: ['@hydra/core-domain', '@hydra/core-usecases', '@hydra/infrastructure'],

    // Speed up compilation by skipping type-checking (tsc handles that separately)
    typescript: {
        ignoreBuildErrors: false,
    },

    // Reduce ESLint overhead during dev server startup
    eslint: {
        ignoreDuringBuilds: false,
    },

    // Webpack optimisations for dev mode
    webpack: (config, { dev, isServer }) => {
        if (dev) {
            // Use polling for file-watching so WSL2/Docker volume changes are detected reliably
            config.watchOptions = {
                poll: 1000,
                aggregateTimeout: 300,
            };
        }
        return config;
    },
};

module.exports = withPWA(nextConfig);
