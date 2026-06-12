import { SaasConnectorPage } from "~/components/workspace/SaasConnectorPage";

export const metadata = { title: "Salesforce connector" };

export default function SalesforceConnectorPage() {
  return <SaasConnectorPage provider="salesforce" />;
}
