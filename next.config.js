/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Default build mode - compatible with Cloud Functions
  // Note: 'standalone' mode is NOT compatible with Cloud Functions
  
  // Webpack configuration to externalize Firebase Admin SDK
  // This prevents webpack from bundling firebase-admin, which causes hangs in Cloud Functions
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize firebase-admin and its submodules
      // Preserve existing externals and add firebase-admin
      const existingExternals = config.externals || [];
      config.externals = [
        ...existingExternals,
        {
          'firebase-admin': 'commonjs firebase-admin',
          'firebase-admin/firestore': 'commonjs firebase-admin/firestore',
          'firebase-admin/auth': 'commonjs firebase-admin/auth',
          'firebase-admin/storage': 'commonjs firebase-admin/storage',
        },
      ];
    }
    return config;
  },
}

module.exports = nextConfig
