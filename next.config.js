/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Configure experimental features
  experimental: {
    // Disable turbopack for better compatibility
    turbo: undefined,
  },
  
  // Configure webpack for better compatibility
  webpack: (config, { isServer }) => {
    // Disable webpack cache in Docker to prevent native module issues
    config.cache = false;
    
    // Handle native modules properly
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        'lightningcss': 'lightningcss',
      });
    }
    
    return config;
  },
  
  // Optimize for production
  compress: true,
  
  // Configure headers for better performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;