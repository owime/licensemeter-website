import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SaasConnectorPage } from "~/components/workspace/SaasConnectorPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("connectorsDash");
  return { title: t("titles.chatgpt") };
}

export default function ChatGPTConnectorPage() {
  return <SaasConnectorPage provider="chatgpt" />;
}
