import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/database', '@repo/types', '@repo/ui'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async rewrites() {
    return [
      {
        source: '/__clerk/:path*',
        destination: '/clerkproxy/:path*',
      },
    ];
  },
};

export default nextConfig;
