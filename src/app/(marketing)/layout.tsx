import Link from "next/link";

import { BrandMark } from "~/components/BrandMark";
import { HeaderAuthCta } from "~/components/HeaderAuthCta";
import { MarketingMobileNav } from "~/components/MarketingMobileNav";

const SUPPORT_EMAIL = "support@licensemeter.com";

const NAV = [
  { href: "/pricing", label: "Pricing" },
  { href: "/msp", label: "MSP" },
  { href: "/security", label: "Security" },
  { href: "/faq", label: "FAQ" },
];

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#get-started", label: "Free waste scan" },
      { href: "/pricing", label: "Pricing" },
      { href: "/msp", label: "For MSPs" },
      { href: "/security", label: "Security" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/impressum", label: "Impressum" },
      { href: "/datenschutz", label: "Datenschutz" },
      { href: "/security#dpa", label: "DPA (on request)" },
    ],
  },
  {
    title: "Contact",
    links: [
      { href: `mailto:${SUPPORT_EMAIL}`, label: SUPPORT_EMAIL },
      { href: "/security#subprocessors", label: "Subprocessors" },
    ],
  },
];

/*
 * No request-time reads here (cookies, headers): the session-dependent header
 * CTA is resolved client-side by HeaderAuthCta so every marketing route stays
 * statically rendered and CDN-cacheable.
 */
export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-3 px-6 py-6 sm:gap-x-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display text-lg tracking-tight sm:text-xl"
        >
          <BrandMark size={22} />
          <span>
            License<span className="text-rust-text">Meter</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {/* Inline links above sm; below they live in the burger drawer so
              the header keeps only brand + CTA. */}
          <nav aria-label="Main" className="hidden items-center gap-5 sm:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="-my-3 py-3 text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <HeaderAuthCta />
          <MarketingMobileNav items={NAV} />
        </div>
      </header>

      {children}

      <footer className="border-t border-line bg-card">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-display text-lg tracking-tight">
              <BrandMark size={18} />
              <span>
                License<span className="text-rust-text">Meter</span>
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
              License waste analytics for Microsoft 365, with Adobe, Zoom,
              Atlassian and Salesforce connectors in beta. Read-only,
              EU-hosted, built for IT and finance.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-medium tracking-[0.18em] text-ink-faint uppercase">
                {col.title}
              </h3>
              <ul className="mt-3 flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("/") ? (
                      <Link
                        href={link.href}
                        className="-my-1 py-1 text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="-my-1 py-1 text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 border-t border-line px-6 py-6 text-xs text-ink-faint">
          <span>LicenseMeter — built by Ugur Koc</span>
          <span>
            Independent tool, not affiliated with Microsoft, Adobe, Zoom,
            Atlassian or Salesforce. All product names are trademarks of their
            respective owners.
          </span>
        </div>
      </footer>
    </div>
  );
}
