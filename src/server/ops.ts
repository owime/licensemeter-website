import { eq, sql } from "drizzle-orm";

import { env } from "~/env";
import { db } from "~/server/db";
import { opsAlerts } from "~/server/db/schema";
import { emailEnabled, sendEmail } from "~/server/email";

const escapeHtml = (s: string): string =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

export type NotifyOptions = {
  /** Dedup key: identical keys within the cooldown are suppressed and counted. */
  key?: string;
  /** Cooldown window in ms; only meaningful together with key. */
  cooldownMs?: number;
};

/**
 * Operational alerting, fan-out to whatever is configured:
 * - ALERT_WEBHOOK_URL (Teams/Slack incoming webhook, {text} payload)
 * - ALERT_EMAIL via Resend (requires RESEND_API_KEY + EMAIL_FROM)
 * DB-backed cooldown dedup keeps incident storms from flooding either channel.
 * Never throws: alerting must not take down the thing it alerts about.
 */
export const notifyOps = async (
  text: string,
  opts: NotifyOptions = {},
): Promise<void> => {
  console.error(`[ops] ${text}`);

  // Webhook/email fire only from the production deployment. Local dev and
  // preview deploys share the same .env credentials, and a crash on a dev
  // machine must not page anyone (VERCEL_ENV is unset locally, "preview" on
  // preview deploys). Raw process.env: system var, not in the env schema.
  if (process.env.VERCEL_ENV !== "production") return;

  const wantWebhook = Boolean(env.ALERT_WEBHOOK_URL);
  const wantEmail = Boolean(env.ALERT_EMAIL) && emailEnabled();
  if (!wantWebhook && !wantEmail) return;

  let suffix = "";
  if (opts.key && opts.cooldownMs) {
    try {
      const row = await db.query.opsAlerts.findFirst({
        where: eq(opsAlerts.key, opts.key),
      });
      const now = Date.now();
      if (row && now - row.lastSentAt.getTime() < opts.cooldownMs) {
        await db
          .update(opsAlerts)
          .set({ suppressedCount: sql`${opsAlerts.suppressedCount} + 1` })
          .where(eq(opsAlerts.key, opts.key));
        return;
      }
      if (row && row.suppressedCount > 0) {
        suffix = ` (${row.suppressedCount} similar suppressed since the last alert)`;
      }
      await db
        .insert(opsAlerts)
        .values({ key: opts.key, lastSentAt: new Date(), suppressedCount: 0 })
        .onConflictDoUpdate({
          target: opsAlerts.key,
          set: { lastSentAt: new Date(), suppressedCount: 0 },
        });
    } catch (err) {
      console.error("[ops] dedup bookkeeping failed", err);
    }
  }

  const message = `${text}${suffix}`;

  if (wantWebhook) {
    try {
      await fetch(env.ALERT_WEBHOOK_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `LicenseMeter: ${message}` }),
        signal: AbortSignal.timeout(5000),
      });
    } catch (err) {
      console.error("[ops] alert webhook failed", err);
    }
  }

  if (wantEmail) {
    try {
      await sendEmail({
        to: [env.ALERT_EMAIL!],
        subject: `LicenseMeter alert: ${text.slice(0, 80)}`,
        html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1c1a16;max-width:560px">
  <p>${escapeHtml(message)}</p>
  <p style="font-size:11px;color:#a39d8f">Operational alert from licensemeter.com. Sync failures and crashes are deduplicated per 30-minute window.</p>
</div>`,
      });
    } catch (err) {
      console.error("[ops] alert email failed", err);
    }
  }
};
