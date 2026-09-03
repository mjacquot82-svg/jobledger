import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse uses Node-specific module loading. Keep it out of the Route
  // Handler bundle so Railway resolves the package natively at runtime.
  serverExternalPackages: ["pdf-parse"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
