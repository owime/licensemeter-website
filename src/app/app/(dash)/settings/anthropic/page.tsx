import { SaasConnectorPage } from "~/components/workspace/SaasConnectorPage";

export const metadata = { title: "Anthropic connector" };

export default function AnthropicConnectorPage() {
  return <SaasConnectorPage provider="anthropic" />;
}
