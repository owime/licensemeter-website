import Link from "next/link";

import { ButtonLink } from "~/components/ui";
import { auth } from "~/server/auth";

/*
 * TODO before launch: replace the placeholder contact address below and in
 * the legal pages with your real support address.
 */
const SUPPORT_EMAIL = "support@your-domain.example";

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
        <Link href="/" className="font-display text-xl tracking-tight">
          License<span className="text-rust-text">Meter</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
            >
              {item.label}
            </Link>
          ))}
          {session?.user ? (
            <ButtonLink href="/app" variant="secondary" className="ml-1">
              Open dashboard
            </ButtonLink>
          ) : (
            <ButtonLink
              href="/#get-started"
              variant="secondary"
              className="ml-1 hidden sm:inline-flex"
            >
              Free waste scan
            </ButtonLink>
          )}
        </nav>
      </header>

      {children}

      <footer className="border-t border-line bg-card">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="font-display text-lg tracking-tight">
              License<span className="text-rust-text">Meter</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
              License waste analytics for Microsoft 365. Read-only, EU-hosted,
              built for IT and finance.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="text-xs font-medium tracking-[0.18em] text-ink-faint uppercase">
                {col.title}
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 border-t border-line px-6 py-6 text-xs text-ink-faint">
          <span>LicenseMeter — built by Ugur Koc</span>
          <span>Independent tool. Not affiliated with Microsoft.</span>
        </div>
      </footer>
    </div>
  );
}
