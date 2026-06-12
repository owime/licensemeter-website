import { SaasConnectorPage } from "~/components/workspace/SaasConnectorPage";

export const metadata = { title: "Atlassian connector" };

export default function AtlassianConnectorPage() {
  return <SaasConnectorPage provider="atlassian" />;
}
