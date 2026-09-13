"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MarketingMobileNav } from "~/components/MarketingMobileNav";

const ENGLISH = [
  { href: "/msp", label: "MSP" },
  { href: "/trust-center", label: "Trust Center" },
  { href: "/faq", label: "FAQ" },
];

const GERMAN = [
  { href: "/de/security", label: "Sicherheit" },
  { href: "/de/trust-center", label: "Trust Center" },
  { href: "/de/dpa", label: "AV-Vertrag" },
  { href: "/", label: "English" },
];

export const MarketingNav = () => {
  const pathname = usePathname();
  const items = pathname.startsWith("/de/") ? GERMAN : ENGLISH;
  const navLabel = pathname.startsWith("/de/") ? "Hauptnavigation" : "Main";
  return (
    <>
      <nav aria-label={navLabel} className="hidden items-center gap-5 sm:flex">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-ink-soft hover:text-ink -my-3 py-3 text-sm underline-offset-4 hover:underline"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <MarketingMobileNav items={items} navLabel={navLabel} />
    </>
  );
};
