/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  serverExternalPackages: ["@electric-sql/pglite"],
  experimental: {
    serverActions: {
      // The CSV trial posts two admin-center exports (5 MB each, checked
      // server-side) through a server action; the default limit is 1 MB.
      bodySizeLimit: "8mb",
    },
  },
  // The floating dev badge sits exactly over the sidebar's sign-out button.
  devIndicators: false,
  // Serve the status page at status.licensemeter.com/ once the subdomain is
  // pointed at this project. Other paths on the subdomain fall through to the
  // normal app; the subdomain is only meant as an entry point to /status.
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          has: [{ type: "host", value: "status.licensemeter.com" }],
          destination: "/status",
        },
      ],
    };
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
        ],
      },
    ];
  },
};

export default config;
