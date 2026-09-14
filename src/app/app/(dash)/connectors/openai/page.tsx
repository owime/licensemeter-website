import { SaasConnectorPage } from "~/components/workspace/SaasConnectorPage";

export const metadata = { title: "OpenAI connector" };
// Connect action syncs in after(); needs the same 300s budget as other sync paths.
export const maxDuration = 300;

export default async function OpenAIConnectorPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  return (
    <SaasConnectorPage
      provider="openai"
      previewRequested={(await searchParams).preview === "sample"}
    />
  );
}
