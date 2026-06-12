import { SaasConnectorPage } from "~/components/workspace/SaasConnectorPage";

export const metadata = { title: "Claude connector" };

export default function ClaudeConnectorPage() {
  return <SaasConnectorPage provider="claude" />;
}
