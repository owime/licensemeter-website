import { SaasConnectorPage } from "~/components/workspace/SaasConnectorPage";

export const metadata = { title: "Zoom connector" };

export default function ZoomConnectorPage() {
  return <SaasConnectorPage provider="zoom" />;
}
