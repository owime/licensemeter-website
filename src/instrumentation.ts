/**
 * Next.js server-error hook: every unhandled error in route handlers, server
 * components and server actions lands here. Reports to the ops webhook when
 * configured (Sentry-class basics without another vendor); always logs.
 * Uses raw process.env: instrumentation runs before env validation.
 */
export function register(): void {
  // No startup instrumentation needed yet.
}

export const onRequestError = async (
  err: unknown,
  request: { path: string; method: string },
): Promise<void> => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[onRequestError] ${request.method} ${request.path}:`, err);

  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    // Dynamic import: keeps instrumentation startup free of env/db loading.
    const { notifyOps } = await import("~/server/ops");
    await notifyOps(
      `unhandled error on ${request.method} ${request.path}: ${message.slice(0, 300)}`,
      { key: `crash:${request.method}:${request.path}`, cooldownMs: 30 * 60 * 1000 },
    );
  } catch {
    // alerting must never cascade
  }
};
