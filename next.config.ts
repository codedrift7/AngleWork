import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize production builds
  reactStrictMode: true,
  
  // Server Actions configuration
  experimental: {
    // Ensure Server Actions are properly registered
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Logging for debugging deployment issues
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
