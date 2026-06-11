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

    /** Session cookie signing secret. Generate with `openssl rand -base64 32`. */
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

    /**
     * Shared secret protecting /api/cron/* routes (Vercel Cron sends it as a
     * Bearer token). Required on Vercel builds so a deploy cannot silently
     * ship an unscheduled (or unprotected) cron; the route also fails closed
     * (401) when unset.
     */
    CRON_SECRET: process.env.VERCEL
      ? z.string().min(16)
      : z.string().min(16).optional(),

    /** "true" enables the demo workspace (fixture tenant, credentials-free entry). */
    DEMO_MODE: z.enum(["true", "false"]).optional(),

    /**
     * Incoming-webhook URL (Teams/Slack compatible) for operational alerts —
     * failed syncs, cron errors. Optional; alerts log to console without it.
     */
    ALERT_WEBHOOK_URL: z.string().url().optional(),

    /** Resend API key for the weekly digest. Optional; digest skips without it. */
    RESEND_API_KEY: z.string().optional(),
    /** From address for outgoing mail, e.g. "LicenseMeter <digest@licensemeter.com>". */
    EMAIL_FROM: z.string().optional(),

    /**
     * Public base URL, used to build the admin-consent redirect URI.
     * Required on Vercel builds: without it the consent flow would send a
     * relative redirect_uri, which Microsoft rejects.
     */
    APP_BASE_URL: process.env.VERCEL
      ? z.string().url()
      : z.string().url().optional(),
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
    ALERT_WEBHOOK_URL: process.env.ALERT_WEBHOOK_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});

export const isDemoMode = () => env.DEMO_MODE === "true";

/**
 * Like appBaseUrl but never throws — for sitemap/OG metadata where a localhost
 * fallback during local production builds is harmless.
 */
export const siteUrl = () => env.APP_BASE_URL ?? "http://localhost:3000";

export const appBaseUrl = () => {
  if (env.APP_BASE_URL) return env.APP_BASE_URL;
  if (env.NODE_ENV === "production") {
    throw new Error("APP_BASE_URL must be set in production");
  }
  return "http://localhost:3000";
};
