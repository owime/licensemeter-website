import { siteUrl } from "~/env";
import { CONNECTOR_GUIDES } from "~/lib/connectorGuides";
import { SITE_DEFINITION } from "~/lib/site";

/* Curated site map for LLMs (llms.txt convention): a definition, the facts
 * worth citing, and where the details live. Served as a route handler: a
 * public/ file would conflict with App Router metadata routes. */
export const dynamic = "force-static";

export function GET(): Response {
  const base = siteUrl();
  const body = `# LicenseMeter

> ${SITE_DEFINITION}

Operated by UgurLabs UG and maintained by Ugur Koc, Microsoft MVP for Intune and Security Copilot. Key facts:

- Read-only by design: the connector app holds no write scopes; remediation ships as generated PowerShell scripts that admins review and run themselves.
- Never reads content: no mailboxes, files or messages. License assignments, sign-in activity and usage metadata only.
- EU data residency (Postgres, Frankfurt); disconnecting a workspace deletes all synced data immediately.
- Flat pricing per tenant: Starter € 79/month (up to 250 seats), Growth € 199/month (up to 1.000 seats), Scale € 499/month (up to 2.500 seats). The first waste scan is free.
- Works with and without Entra ID P1: detection falls back to Microsoft 365 usage reports when precise sign-in timestamps are unavailable.

## Pages

- [Home](${base}/): product overview, live demo entry and the free waste scan
- [Pricing](${base}/pricing): flat per-tenant tiers and what every plan includes
- [For MSPs](${base}/msp): portfolio view across client tenants, consultant consent flow, per-client price books and QBR-ready reports
- [ROI calculator](${base}/roi): estimate the monthly license waste for a tenant by seat count and per-seat cost, computed entirely in the browser
- [vs PowerShell audit](${base}/compare/powershell-audit): honest comparison of a manual Get-MgUser/Get-MgSubscribedSku audit with continuous joined-signal detection
- [Security](${base}/security): granted scopes, stored data, residency, subprocessors, DPA
- [Trust Center](${base}/trust-center): how data is accessed, where it lives, who processes it, and the documents behind it (German version at ${base}/de/trust-center)
- [DPA](${base}/dpa): pre-signed Art. 28 GDPR data processing agreement, downloadable in English and German (German version at ${base}/de/dpa)
- [FAQ](${base}/faq): the questions IT and security teams ask before granting admin consent
- [Connectors](${base}/connectors): step-by-step setup guides for all ${CONNECTOR_GUIDES.length} connectors (${CONNECTOR_GUIDES.map((g) => g.name).join(", ")})
- [Status](${base}/status): live operational status for LicenseMeter and the infrastructure it relies on
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
