import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow GitHub Codespaces proxy
  allowedDevOrigins: [
    "upgraded-space-spoon-q7xrjjjp56xh46vx-3000.app.github.dev",
    "localhost:3000",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "upgraded-space-spoon-q7xrjjjp56xh46vx-3000.app.github.dev",
        "localhost:3000",
      ],
    },
  },
};

export default nextConfig;
