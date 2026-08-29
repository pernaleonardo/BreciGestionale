import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "*.github.dev",
        "*.preview.app.github.dev"
      ]
    }
  }
};

export default nextConfig;
