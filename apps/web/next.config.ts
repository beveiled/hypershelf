import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    reactCompiler: true,
  },
  transpilePackages: ["@hypershelf/lib", "@hypershelf/ui"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
