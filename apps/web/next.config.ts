import type { NextConfig } from "next";

// Backend (@portal/api) reachable from this server. Rewrites are resolved at build time.
const apiInternalUrl = process.env.API_INTERNAL_URL ?? "http://localhost:4100";

// Baseline security headers for every page. No CSP yet: Next's inline scripts would need nonces.
const securityHeaders = [
  // Do not guess content types (a file served as text is never run as a script).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Other sites cannot frame the site (clickjacking).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Links to other sites get only the origin, never the path or query (they may hold ids).
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The site uses none of these browser features.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // HTTPS only, from the first response in production (ignored by browsers over plain HTTP).
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  // Do not let `next dev` append generated rules to the project's CLAUDE.md.
  agentRules: false,
  // Do not advertise the framework in every response.
  poweredByHeader: false,
  transpilePackages: ["@portal/shared"],
  // Remote images (CDN loader, allowed hosts): see docs/recipes/cloudinary.md.
  // The browser only talks to this origin: /api/** is proxied to the backend,
  // so session cookies stay first-party and no CORS is needed.
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiInternalUrl}/api/:path*` }];
  },
};

export default nextConfig;
