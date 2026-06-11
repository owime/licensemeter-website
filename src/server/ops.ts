import { env } from "~/env";

/**
 * Operational alerting. Posts to a Teams/Slack-compatible incoming webhook
 * when ALERT_WEBHOOK_URL is set; always logs. Never throws — alerting must
 * not take down the thing it alerts about.
 */
export const notifyOps = async (text: string): Promise<void> => {
  console.error(`[ops] ${text}`);
  if (!env.ALERT_WEBHOOK_URL) return;
  try {
    await fetch(env.ALERT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `LicenseMeter: ${text}` }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.error("[ops] alert webhook failed", err);
  }
};
