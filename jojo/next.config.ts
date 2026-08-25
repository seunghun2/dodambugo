import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  reactCompiler: true,
  serverExternalPackages: ['firebase-admin'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mnlyqhrjnpbkleenmszm.supabase.co',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'tbteghoppechzotdojna.supabase.co',
        pathname: '/storage/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/view/:id*',
        headers: [
          {
            key: 'Cache-Control',
            // Vercel CDN 엣지에서 60초 캐시 + 5분간 stale 허용 (DB 부하 대폭 감소)
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        source: '/b2b/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
