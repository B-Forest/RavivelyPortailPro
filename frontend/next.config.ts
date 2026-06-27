import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  cacheComponents: true,
  cacheLife: {
    static: {
      stale: 300,
      revalidate: 3600,
      expire: 86400
    }
  }
};

export default nextConfig;
