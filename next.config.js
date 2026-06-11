/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  serverExternalPackages: ["@electric-sql/pglite"],
  // The floating dev badge sits exactly over the sidebar's sign-out button.
  devIndicators: false,
};

export default config;
