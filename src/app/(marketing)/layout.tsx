import Link from "next/link";

import { BrandHomeLink } from "~/components/BrandHomeLink";
import { BrandMark } from "~/components/BrandMark";
import { HeaderAuthCta } from "~/components/HeaderAuthCta";
import { MarketingMobileNav } from "~/components/MarketingMobileNav";
import { siteUrl } from "~/env";
import { SUPPORT_MAILTO } from "~/lib/support";

const NAV = [
  { href: "/pricing", label: "Pricing" },
  { href: "/msp", label: "MSP" },
  { href: "/trust-center", label: "Trust Center" },
  { href: "/faq", label: "FAQ" },
];

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#get-started", label: "Start free" },
      { href: "/pricing", label: "Pricing" },
      { href: "/msp", label: "For MSPs" },
      { href: "/connectors", label: "Connectors" },
      { href: "/security", label: "Security" },
      { href: "/faq", label: "FAQ" },
      { href: "/status", label: "Status" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/waste", label: "Waste patterns" },
      { href: "/sample-report", label: "Sample report" },
      { href: "/roi", label: "ROI calculator" },
      { href: "/compare/powershell-audit", label: "vs PowerShell audit" },
      { href: "/compare/m365-admin-center", label: "vs M365 admin center" },
      { href: "/compare/excel-license-tracking", label: "vs Excel tracking" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/trust-center", label: "Trust Center" },
      { href: "/impressum", label: "Imprint" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/cookies", label: "Cookie policy" },
      { href: "/dpa", label: "Data Processing Agreement" },
    ],
  },
  {
    title: "Contact",
    links: [{ href: "/trust-center#subprocessors", label: "Subprocessors" }],
  },
];

const SOCIAL_LINKS = [
  {
    href: "https://github.com/ugurkocde/licensemeter",
    label: "GitHub",
    icon: (
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.21.7.82.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" />
    ),
  },
  {
    href: "https://x.com/ugurkocde",
    label: "X",
    icon: (
      <path d="M18.9 1.5h3.68l-8.04 9.19L24 22.5h-7.4l-5.8-7.58-6.64 7.58H.48l8.6-9.83L0 1.5h7.59l5.24 6.93L18.9 1.5Zm-1.29 18.79h2.04L6.49 3.6H4.3l13.31 16.69Z" />
    ),
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
    <div className="bg-canvas min-h-screen">
      <a
        href="#content"
        className="focus:border-ink focus:bg-canvas focus:text-ink sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:border focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>
      <header className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-3 px-6 py-6 sm:gap-x-6">
        <BrandHomeLink
          homeUrl={siteUrl()}
          className="font-display flex items-center gap-2.5 text-lg tracking-tight sm:text-xl"
        >
          <BrandMark size={22} />
          <span>
            License<span className="text-brand-text">Meter</span>
          </span>
        </BrandHomeLink>
        <div className="flex items-center gap-2 sm:gap-5">
          {/* Inline links above sm; below they live in the burger drawer so
              the header keeps only brand + CTA. */}
          <nav aria-label="Main" className="hidden items-center gap-5 sm:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-ink-soft hover:text-ink -my-3 py-3 text-sm underline-offset-4 hover:underline"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <HeaderAuthCta />
          <MarketingMobileNav items={NAV} />
        </div>
      </header>

      {/* Skip-link target. Each marketing page renders its own <main>, so this
          wrapper only carries the id and adds no extra landmark. */}
      <div id="content">{children}</div>

      <footer className="border-line bg-card border-t">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <div className="font-display flex items-center gap-2 text-lg tracking-tight">
              <BrandMark size={18} />
              <span>
                License<span className="text-brand-text">Meter</span>
              </span>
            </div>
            <p className="text-ink-soft mt-3 max-w-xs text-sm leading-relaxed">
              License waste analytics for Microsoft 365, with Adobe, Zoom,
              Atlassian, Salesforce, OpenAI, Anthropic, ChatGPT and Claude
              connectors. Read-only, EU-hosted, built for IT and finance.
            </p>
            <p className="border-line-strong text-ink-soft bg-canvas mt-4 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
              <span aria-hidden="true">🇪🇺</span>
              Hosted in the EU
            </p>
            <div className="mt-4 flex items-center gap-2">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="border-line-strong text-ink-soft hover:border-brand hover:text-ink focus-visible:ring-brand focus-visible:ring-offset-card bg-canvas inline-flex h-9 w-9 items-center justify-center rounded-lg border transition focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    {social.icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-ink-faint text-xs font-medium tracking-[0.18em] uppercase">
                {col.title}
              </h3>
              {col.title === "Contact" && (
                <a
                  href={SUPPORT_MAILTO}
                  className="border-line-strong text-ink hover:border-brand focus-visible:ring-brand bg-canvas focus-visible:ring-offset-card mt-4 inline-flex min-h-11 touch-manipulation items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  Email support
                </a>
              )}
              <ul className="mt-3 flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("/") ? (
                      <Link
                        href={link.href}
                        className="text-ink-soft hover:text-ink -my-1 py-1 text-sm underline-offset-4 hover:underline"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-ink-soft hover:text-ink -my-1 py-1 text-sm underline-offset-4 hover:underline"
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
        <div className="border-line text-ink-faint mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 border-t px-6 py-6 text-xs">
          <span>
            &copy; {new Date().getFullYear()} LicenseMeter, operated by UgurLabs
          </span>
          <span>
            Independent tool, not affiliated with Microsoft, Adobe, Zoom,
            Atlassian, Salesforce, OpenAI, Anthropic, ChatGPT or Claude. All
            product names are trademarks of their respective owners.
          </span>
        </div>
      </footer>
    </div>
  );
}
