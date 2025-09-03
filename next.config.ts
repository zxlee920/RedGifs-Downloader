import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // 在构建时忽略TypeScript错误
    ignoreBuildErrors: true,
  },
  eslint: {
    // 在构建时忽略ESLint错误
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
