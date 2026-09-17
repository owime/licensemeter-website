import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SaasConnectorPage } from "~/components/workspace/SaasConnectorPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("connectorsDash");
  return { title: t("titles.claude") };
}

export default function ClaudeConnectorPage() {
  return <SaasConnectorPage provider="claude" />;
}
