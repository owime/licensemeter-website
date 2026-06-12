import { SaasConnectorPage } from "~/components/workspace/SaasConnectorPage";

export const metadata = { title: "ChatGPT connector" };

export default function ChatGPTConnectorPage() {
  return <SaasConnectorPage provider="chatgpt" />;
}
