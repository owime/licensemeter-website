import type { Metadata } from "next";

import { siteUrl } from "~/env";

import { TrustCenterView } from "./TrustCenterView";

/*
 * Indexable trust/sales asset like /security and /dpa. English is the
 * canonical, SSR-rendered language; German is available via the in-page toggle
 * in TrustCenterView. The page itself stays server-side so it can carry
 * metadata and the static JSON-LD breadcrumb without request-time data.
 */
export const metadata: Metadata = {
  title: "Trust Center",
  description:
    "One place for how LicenseMeter handles your data: read-only access, EU data residency, named subprocessors with their processing locations, encryption, retention and the pre-signed GDPR DPA.",
  alternates: { canonical: "/trust-center" },
};

const BASE = siteUrl();

export default function TrustCenterPage() {
  return (
    <>
      <TrustCenterView />
      <script
        type="application/ld+json"
        // Static breadcrumb; "<" escaped so nothing can terminate the script.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: BASE },
              {
                "@type": "ListItem",
                position: 2,
                name: "Trust Center",
                item: `${BASE}/trust-center`,
              },
            ],
          }).replaceAll("<", "\\u003c"),
        }}
      />
    </>
  );
}
