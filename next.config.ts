import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: true,
  },
  // Set production port to 3090
  env: {
    PORT: process.env.NODE_ENV === 'production' ? '3090' : '3000'
  }
};

export default nextConfig;
