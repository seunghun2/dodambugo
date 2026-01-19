import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
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
};

export default nextConfig;
