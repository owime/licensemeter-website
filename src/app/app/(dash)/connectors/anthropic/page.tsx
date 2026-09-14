import { SaasConnectorPage } from "~/components/workspace/SaasConnectorPage";

export const metadata = { title: "Anthropic connector" };
// Connect action syncs in after(); needs the same 300s budget as other sync paths.
export const maxDuration = 300;

export default function AnthropicConnectorPage() {
  return <SaasConnectorPage provider="anthropic" />;
}
