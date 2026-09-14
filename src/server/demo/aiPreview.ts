import { demoSaasClient } from "~/server/saas/registry";

export const AI_PREVIEW_PROVIDERS = ["openai", "anthropic"] as const;
export type AiPreviewProvider = (typeof AI_PREVIEW_PROVIDERS)[number];

/** Explicit previews never replace a real connection or an existing snapshot. */
export const shouldPreviewAi = ({
  isDemo,
  requested,
  hasConnection,
  hasData,
}: {
  isDemo: boolean;
  requested: boolean;
  hasConnection: boolean;
  hasData: boolean;
}): boolean => isDemo || (requested && !hasConnection && !hasData);

/** Read-only fixtures, generated at request time so the chart never goes stale.
 * No credentials, provider requests, or writes to a customer's workspace.
 */
export const getAiPreview = async (provider: AiPreviewProvider) => {
  const client = demoSaasClient(provider);
  const [spend, members] = await Promise.all([
    client.getSpend(""),
    client.getSeats(),
  ]);
  return {
    provider,
    members,
    spend: spend
      .map((row) => ({ ...row, provider }))
      .sort((a, b) => a.day.localeCompare(b.day)),
  };
};
