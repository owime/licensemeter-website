import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SaasConnectorPage } from "~/components/workspace/SaasConnectorPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("connectorsDash");
  return { title: t("titles.zoom") };
}
// The connect action runs the first sync in after(); give the route the same
// 300s budget every other sync path has so it is not cut short.
export const maxDuration = 300;

export default function ZoomConnectorPage() {
  return <SaasConnectorPage provider="zoom" />;
}
