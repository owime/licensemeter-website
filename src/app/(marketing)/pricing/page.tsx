import type { Metadata } from "next";
import Link from "next/link";

import { signInEnabled, signInPath, siteUrl, taxEnabled } from "~/env";
import { PricingTiers } from "~/components/pricing/PricingTiers";
import {
  DEMO_ANNUAL_WASTE_ROUNDED,
  DEMO_FIGURES,
  demoEuros,
} from "~/lib/demoFigures";
import { MSP_PRICE_EUR, PLANS, TRIAL_DAYS } from "~/lib/plans";
import { ALL_RULES } from "~/lib/rules";
import { SITE_DEFINITION } from "~/lib/site";
import { SUPPORT_MAILTO } from "~/lib/support";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Flat monthly pricing per tenant, sized by seat count. Every plan starts with a free waste scan.",
};

const BASE = siteUrl();

/* Growth annual cost, computed from the plan price so the payback copy can
 * never drift from the cards. German thousands format, whole euros. */
const GROWTH_ANNUAL = new Intl.NumberFormat("de-DE").format(
  PLANS.find((p) => p.tier === "growth")!.annual,
);

/* SoftwareApplication with concrete EUR offers: the machine-readable price
 * list answer engines quote instead of guessing. Both intervals from PLANS;
 * "<" escaped so nothing can terminate the script element. */
const PRICING_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": `${BASE}/#software`,
      name: "LicenseMeter",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: BASE,
      description: SITE_DEFINITION,
      publisher: { "@id": `${BASE}/#organization` },
      offers: PLANS.flatMap((plan) => [
        {
          "@type": "Offer",
          name: plan.name,
          price: String(plan.monthly),
          priceCurrency: "EUR",
          // Google requires availability or priceValidUntil for price snippets.
          availability: "https://schema.org/InStock",
          description: `Per tenant, per month, ${plan.seats}`,
          url: `${BASE}/pricing`,
        },
        {
          "@type": "Offer",
          name: `${plan.name} (annual)`,
          price: String(plan.annual),
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          description: `Per tenant, per year, ${plan.seats}`,
          url: `${BASE}/pricing`,
        },
      ]),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE },
        {
          "@type": "ListItem",
          position: 2,
          name: "Pricing",
          item: `${BASE}/pricing`,
        },
      ],
    },
  ],
};

const INCLUDED = [
  // Count computed from the engine so the copy cannot go stale.
  `All ${ALL_RULES.length} waste rules with monthly euro impact`,
  "Unlimited workspace members (finance viewers included)",
  "Nightly sync, manual sync, full sync history",
  "Editable price book with list-price estimates",
  "CSV exports and generated PowerShell remediation scripts",
  "EU data residency, deletion on disconnect",
];

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pt-6 pb-24">
      <p className="text-brand-text text-xs font-medium tracking-[0.2em] uppercase">
        Pricing
      </p>
      <h1 className="font-display mt-4 text-4xl tracking-tight text-balance">
        Flat per tenant. Sized by seats, not by your waste.
      </h1>
      <p className="text-ink-soft mt-4 max-w-2xl text-lg leading-relaxed">
        Every plan starts the same way: connect read-only and see your waste
        number for free. The subscription is for acting on it month after month.
        Licenses leak every time someone joins, moves or leaves.
      </p>

      <div className="mt-12">
        <PricingTiers
          signInEnabled={signInEnabled()}
          signInHref={signInPath()}
        />
      </div>

      {taxEnabled() ? (
        <p className="text-ink-soft mt-4 text-sm">
          Prices exclude VAT; it is added at checkout where applicable. EU
          businesses with a valid VAT ID are reverse-charged.
        </p>
      ) : (
        <p className="text-ink-soft mt-4 text-sm">
          {TRIAL_DAYS}-day free trial. No credit card required.
        </p>
      )}

      <p className="text-ink-soft mt-4 text-sm">
        More than 2.500 seats in a single tenant?{" "}
        <a
          href={SUPPORT_MAILTO}
          className="text-ink hover:text-brand-text font-medium underline underline-offset-4"
        >
          Talk to us.
        </a>
      </p>

      <div className="border-line bg-card mt-6 border px-6 py-5">
        <p className="text-ink-soft text-sm leading-relaxed">
          Running Microsoft 365 for multiple client tenants?{" "}
          <span className="tnum font-mono">€ {MSP_PRICE_EUR}</span> per tenant,
          billed across your portfolio on one subscription - with a portfolio
          view sorted by waste, per-client price books and a QBR-ready report
          for each. Self-serve, no sales call.{" "}
          <Link
            href="/msp"
            className="text-ink hover:text-brand-text font-medium underline underline-offset-4"
          >
            See MSP pricing
          </Link>
          .
        </p>
      </div>

      <section className="mt-14 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl tracking-tight">
            Every plan includes
          </h2>
          <ul className="text-ink-soft mt-4 flex flex-col gap-2 text-sm">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden="true" className="text-moss mt-0.5">
                  ·
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="border-line bg-card border px-6 py-6">
          <h2 className="text-ink-faint text-xs font-medium tracking-[0.18em] uppercase">
            Does it pay for itself?
          </h2>
          <p className="text-ink-soft mt-3 text-sm leading-relaxed">
            A single Microsoft 365 E3 seat is roughly{" "}
            <span className="tnum font-mono">€ 440</span> a year, a Copilot seat
            about <span className="tnum font-mono">€ 340</span>. The Growth plan
            costs <span className="tnum font-mono">€ {GROWTH_ANNUAL}</span> a
            year. Six reclaimed E3 seats cover it. The live demo tenant of{" "}
            {DEMO_FIGURES.users} people shows{" "}
            <span className="tnum text-waste-text font-mono">
              € {demoEuros(DEMO_FIGURES.monthlyWasteCents)}
            </span>{" "}
            a month recoverable, about{" "}
            <span className="tnum text-waste-text font-mono">
              € {DEMO_ANNUAL_WASTE_ROUNDED}
            </span>{" "}
            a year.
          </p>
          <p className="text-ink-faint mt-3 text-xs">
            Every plan starts with a {TRIAL_DAYS}-day free trial, no credit card
            required. Connect, see your number, and only subscribe if you keep
            monitoring it month after month.
          </p>
        </div>
      </section>

      <p className="text-ink-soft mt-12 text-sm">
        Questions about scopes or data handling first? Read the{" "}
        <Link
          href="/security"
          className="text-ink hover:text-brand-text font-medium underline underline-offset-4"
        >
          security overview
        </Link>{" "}
        or the{" "}
        <Link
          href="/faq"
          className="text-ink hover:text-brand-text font-medium underline underline-offset-4"
        >
          FAQ
        </Link>
        .
      </p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(PRICING_LD).replaceAll("<", "\\u003c"),
        }}
      />
    </main>
  );
}
