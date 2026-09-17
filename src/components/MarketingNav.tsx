"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "~/components/LanguageSwitcher";
import { MarketingMobileNav } from "~/components/MarketingMobileNav";

const GERMAN = [
  { href: "/de/security", label: "Sicherheit" },
  { href: "/de/trust-center", label: "Trust Center" },
  { href: "/de/dpa", label: "AV-Vertrag" },
  { href: "/", label: "English" },
  {
    href: "https://github.com/ugurkocde/licensemeter-website",
    label: "GitHub",
  },
];

export const MarketingNav = () => {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const isGerman = pathname.startsWith("/de/");

  const items = isGerman
    ? GERMAN
    : [
        { href: "/#product-tour", label: t("product") },
        { href: "/connectors", label: t("connectors") },
        { href: "/msp", label: t("msp") },
        { href: "/trust-center", label: t("trustCenter") },
        { href: "/support", label: t("support") },
        {
          href: "https://github.com/ugurkocde/licensemeter-website",
          label: t("github"),
        },
      ];
  const navLabel = isGerman ? "Hauptnavigation" : t("ariaLabel");
  return (
    <>
      <nav aria-label={navLabel} className="hidden items-center gap-5 lg:flex">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-ink-soft hover:text-ink -my-3 py-3 text-sm underline-offset-4 hover:underline"
          >
            {item.label}
          </Link>
        ))}
        {!isGerman && <LanguageSwitcher />}
      </nav>
      <MarketingMobileNav items={items} navLabel={navLabel} />
    </>
  );
};
