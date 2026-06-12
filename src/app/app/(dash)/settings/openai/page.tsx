import { SaasConnectorPage } from "~/components/workspace/SaasConnectorPage";

export const metadata = { title: "OpenAI connector" };

export default function OpenAIConnectorPage() {
  return <SaasConnectorPage provider="openai" />;
}
