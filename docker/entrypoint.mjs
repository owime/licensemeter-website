// A build skips validation because it has no secrets. Validate again before
// listening, and never include a credential value in startup errors.
for (const name of ["AUTH_SECRET", "DATA_ENCRYPTION_KEY", "CRON_SECRET"]) {
  if ((process.env[name] ?? "").length < 32) {
    throw new Error(`${name} must contain at least 32 characters`);
  }
}
if (!process.env.DATABASE_URL?.startsWith("postgres")) {
  throw new Error("A PostgreSQL DATABASE_URL is required for self-hosting");
}
const base = new URL(process.env.APP_BASE_URL ?? "");
if (
  base.protocol !== "https:" &&
  !(
    base.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)
  )
) {
  throw new Error("APP_BASE_URL must use HTTPS, except for a local demo");
}
if (
  base.pathname !== "/" ||
  base.search ||
  base.hash ||
  base.username ||
  base.password
) {
  throw new Error(
    "APP_BASE_URL must be an origin without a path, query, or credentials",
  );
}
if (
  process.env.DEMO_MODE !== "true" &&
  (!process.env.AUTH_MICROSOFT_ENTRA_ID_ID ||
    !process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET)
) {
  throw new Error(
    "Configure Microsoft sign-in, or set DEMO_MODE=true for a sample-only instance",
  );
}
await import("../server.js");
