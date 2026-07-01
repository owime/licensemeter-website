/** UTC day-string arithmetic for the AI-spend pull window. */

export const dayString = (d: Date): string => d.toISOString().slice(0, 10);

export const dayMinus = (day: string, days: number): string =>
  dayString(
    new Date(Date.parse(`${day}T00:00:00Z`) - days * 24 * 60 * 60 * 1000),
  );

/** First sync backfills as far as each provider exposes. */
const AI_SPEND_BACKFILL_DAYS = { openai: 180, anthropic: 90 } as const;
/** Later syncs re-pull this window before the newest stored day so late-settling costs heal. */
const AI_SPEND_REPULL_DAYS = 7;
/** Ceiling on the incremental lookback after an outage gap. */
const AI_SPEND_MAX_LOOKBACK_DAYS = 90;

/**
 * First day to request from an AI spend provider. The first sync backfills the
 * provider maximum; later syncs re-pull from AI_SPEND_REPULL_DAYS before the
 * newest stored day, which also heals any gap left by an outage (the window is
 * anchored to the last stored day, not to now). The lookback is capped at
 * AI_SPEND_MAX_LOOKBACK_DAYS so we never request more history than the
 * providers reliably expose.
 */
export const aiSpendSinceDay = (
  latestDay: string | null,
  provider: "openai" | "anthropic",
  now: Date,
): string => {
  const today = dayString(now);
  if (!latestDay) return dayMinus(today, AI_SPEND_BACKFILL_DAYS[provider]);
  const since = dayMinus(latestDay, AI_SPEND_REPULL_DAYS);
  const cap = dayMinus(today, AI_SPEND_MAX_LOOKBACK_DAYS);
  // ISO day strings compare lexicographically.
  return since < cap ? cap : since;
};
