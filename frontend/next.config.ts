import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Avoid Vercel build failures from flat-config / eslint-config-next resolution
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
