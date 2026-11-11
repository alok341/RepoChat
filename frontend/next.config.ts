import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable these aggressive experimental caches to allow dynamic routes to build
  cacheComponents: false,
  partialPrefetching: false,
  
  experimental: {
    agentFeedback: true,
  },
  
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;