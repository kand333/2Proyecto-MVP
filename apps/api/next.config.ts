import type { NextConfig } from "next";

// Backend app: only exposes REST Route Handlers under /api/**.
const nextConfig: NextConfig = {
  // Do not let `next dev` append generated rules to the project's CLAUDE.md.
  agentRules: false,
  // Do not advertise the framework in every response.
  poweredByHeader: false,
  transpilePackages: ["@portal/shared"],
  // JSON only: browsers must not guess another content type.
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }] }];
  },
};

export default nextConfig;
