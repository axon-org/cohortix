import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/database', '@repo/types', '@repo/ui'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

export default nextConfig
