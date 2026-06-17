import { SaasConnectorPage } from "~/components/workspace/SaasConnectorPage";

export const metadata = { title: "Salesforce connector" };
// Connect action syncs in after(); needs the same 300s budget as other sync paths.
export const maxDuration = 300;

export default function SalesforceConnectorPage() {
  return <SaasConnectorPage provider="salesforce" />;
}
