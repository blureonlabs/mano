import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mano/api", "@mano/shared"],
};

export default nextConfig;
