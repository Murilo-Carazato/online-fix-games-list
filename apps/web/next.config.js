/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable transpiling of internal monorepo packages
    transpilePackages: ['@hydra/core-domain', '@hydra/core-usecases', '@hydra/infrastructure'],
};

module.exports = nextConfig;
