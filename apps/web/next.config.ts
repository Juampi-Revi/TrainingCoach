import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@regen/types"],
};

export default nextConfig;
