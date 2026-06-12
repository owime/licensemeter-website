import Link from "next/link";

import { BrandMark } from "~/components/BrandMark";
import { ButtonLink } from "~/components/ui";
import { auth } from "~/server/auth";

const SUPPORT_EMAIL = "support@licensemeter.com";

const NAV = [
  { href: "/pricing", label: "Pricing" },
  { href: "/security", label: "Security" },
  { href: "/faq", label: "FAQ" },
];

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#get-started", label: "Free waste scan" },
      { href: "/pricing", label: "Pricing" },
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

export default async function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display text-xl tracking-tight"
        >
          <BrandMark size={22} />
          <span>
            License<span className="text-rust-text">Meter</span>
          </span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="-my-3 py-3 text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
            >
              {item.label}
            </Link>
          ))}
          {session?.user ? (
            <ButtonLink href="/app" variant="secondary" className="ml-1">
              Open dashboard
            </ButtonLink>
          ) : (
            /*
             * Wrapper span carries the responsive visibility: buttonClass
             * hardcodes inline-flex, which outranks `hidden` in the compiled
             * stylesheet when both sit on the same element.
             */
            <span className="ml-1 hidden sm:inline-flex">
              <ButtonLink href="/#get-started" variant="secondary">
                Free waste scan
              </ButtonLink>
            </span>
          )}
        </nav>
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
