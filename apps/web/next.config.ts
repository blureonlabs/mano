import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mano/api", "@mano/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bjodimpnpwuuoogwufso.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@tanstack/react-query"],
  },
};

export default nextConfig;
