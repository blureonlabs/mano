import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  transpilePackages: ["@mano/api", "@mano/shared", "@mano/integrations"],
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

export default withSentryConfig(nextConfig, {
  // Sentry webpack plugin options
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,

  // Upload source maps but don't make them public
  widenClientFileUpload: true,
  hideSourceMaps: true,

  // Disable telemetry
  telemetry: false,
});
