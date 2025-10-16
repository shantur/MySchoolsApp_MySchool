/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configuration for Cloudflare Workers deployment via OpenNext.js
  // Note: output: 'standalone' is removed as it's incompatible with Cloudflare Workers
  // OpenNext.js handles the build process for edge runtime deployment
  
  // Configure for edge runtime compatibility
  // Ensure all server components and API routes can run on Cloudflare Workers
  experimental: {
    // Enable React Server Components (already default in Next.js 14)
    serverActions: {
      // Ensure server actions work in edge runtime
      allowedOrigins: ['*'],
    },
  },
  
  // Webpack configuration for Cloudflare Workers compatibility
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Preserve existing externals for Node.js compatibility during development
      // Cloudflare Workers will use different bundling via OpenNext.js
      const existingExternals = config.externals || [];
      config.externals = existingExternals;
    }
    return config;
  },
  
  // Static asset optimization for Cloudflare Pages/R2
  images: {
    // Configure image optimization for Cloudflare
    // Cloudflare has built-in image optimization
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all HTTPS images (will be restricted in production)
      },
    ],
  },
}

module.exports = nextConfig

// Initialize OpenNext Cloudflare for local development
// This enables Cloudflare bindings during `next dev`
// See: https://opennext.js.org/cloudflare/get-started#12-develop-locally
const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");
initOpenNextCloudflareForDev();
