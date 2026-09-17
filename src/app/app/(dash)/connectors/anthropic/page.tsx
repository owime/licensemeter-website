import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SaasConnectorPage } from "~/components/workspace/SaasConnectorPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("connectorsDash");
  return { title: t("titles.anthropic") };
}
// Connect action syncs in after(); needs the same 300s budget as other sync paths.
export const maxDuration = 300;

export default async function AnthropicConnectorPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  return (
    <SaasConnectorPage
      provider="anthropic"
      previewRequested={(await searchParams).preview === "sample"}
    />
  );
}
