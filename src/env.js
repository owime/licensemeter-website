import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-side environment variables schema. The app fails the build on invalid env.
   */
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),

    /**
     * Postgres connection string for production (Neon/Supabase EU etc.).
     * When unset, the app falls back to an embedded PGlite database under
     * .pglite/ — development and demo only.
     */
    DATABASE_URL: z.string().url().optional(),

    /** Auth.js session encryption secret. Generate with `openssl rand -base64 32`. */
    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string().min(32)
        : z.string().min(10),

    /**
     * Sign-in app registration (delegated, multi-tenant, openid/profile/email only).
     * Optional so the demo mode works without any Entra setup.
     */
    AUTH_MICROSOFT_ENTRA_ID_ID: z.string().optional(),
    AUTH_MICROSOFT_ENTRA_ID_SECRET: z.string().optional(),

    /**
     * Connector app registration (application permissions, granted per customer
     * tenant via the admin-consent flow). Read-only Graph scopes only.
     */
    CONNECTOR_CLIENT_ID: z.string().optional(),
    CONNECTOR_CLIENT_SECRET: z.string().optional(),

    /** Shared secret protecting /api/cron/* routes (Vercel Cron sends it as a Bearer token). */
    CRON_SECRET: z.string().optional(),

    /** "true" enables the demo workspace (fixture tenant, credentials-free entry). */
    DEMO_MODE: z.enum(["true", "false"]).optional(),

    /** Public base URL, used to build the admin-consent redirect URI. */
    APP_BASE_URL: z.string().url().optional(),
  },

  client: {},

  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_MICROSOFT_ENTRA_ID_ID: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
    AUTH_MICROSOFT_ENTRA_ID_SECRET: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
    CONNECTOR_CLIENT_ID: process.env.CONNECTOR_CLIENT_ID,
    CONNECTOR_CLIENT_SECRET: process.env.CONNECTOR_CLIENT_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
    DEMO_MODE: process.env.DEMO_MODE,
    APP_BASE_URL: process.env.APP_BASE_URL,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});

export const isDemoMode = () => env.DEMO_MODE === "true";

export const appBaseUrl = () =>
  env.APP_BASE_URL ??
  (env.NODE_ENV === "development" ? "http://localhost:3000" : "");
