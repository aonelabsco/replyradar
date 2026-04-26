import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // firebase-admin uses Node.js built-ins not available in edge runtime
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;
