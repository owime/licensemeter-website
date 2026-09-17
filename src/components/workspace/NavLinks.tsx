"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

type NavItem = {
  href: string;
  labelKey: string;
  /** Extra routes that belong to this section, e.g. drill-downs. */
  also?: string[];
};

const ITEMS: NavItem[] = [
  { href: "/app", labelKey: "overview" },
  { href: "/app/findings", labelKey: "findings", also: ["/app/users"] },
  { href: "/app/licenses", labelKey: "licenses" },
  { href: "/app/renewals", labelKey: "renewals" },
  { href: "/app/ai-costs", labelKey: "aiCosts" },
  { href: "/app/connectors", labelKey: "connectors" },
  { href: "/app/settings", labelKey: "settings" },
  { href: "/support", labelKey: "support" },
];

const PORTFOLIO_ITEM: NavItem = { href: "/app/portfolio", labelKey: "portfolio" };

/** True for the route itself and its children, never for sibling prefixes. */
const inSection = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(href + "/");

export const NavLinks = ({
  onNavigate,
  showPortfolio = false,
  navLabel,
}: {
  onNavigate?: () => void;
  showPortfolio?: boolean;
  /** Distinguishes the two render sites (desktop rail vs mobile drawer). */
  navLabel?: string;
}) => {
  const pathname = usePathname();
  const t = useTranslations("dashLayout.nav");

  const items = showPortfolio
    ? [...ITEMS.slice(0, 1), PORTFOLIO_ITEM, ...ITEMS.slice(1)]
    : ITEMS;
  return (
    <nav
      aria-label={navLabel ?? t("ariaLabel")}
      className="flex flex-col gap-0.5"
    >
      {items.map((item) => {
        const sectionActive =
          item.href === "/app"
            ? pathname === "/app"
            : inSection(pathname, item.href) ||
              (item.also ?? []).some((href) => inSection(pathname, href));
        const tourAnchor =
          navLabel === "Workspace navigation"
            ? item.href === "/app/findings"
              ? "nav-findings"
              : item.href === "/app/connectors"
                ? "nav-connectors"
                : undefined
            : undefined;
        return (
          <div key={item.href} className="flex flex-col gap-0.5">
            <Link
              href={item.href}
              data-tour={tourAnchor}
              onClick={onNavigate}
              aria-current={sectionActive ? "page" : undefined}
              className={`border-l-2 px-[18px] py-2.5 text-sm transition ${
                sectionActive
                  ? "border-brand bg-brand-soft text-ink font-medium"
                  : "text-sidebar-soft hover:border-sidebar-soft hover:text-ink border-transparent"
              }`}
            >
              {t(item.labelKey)}
            </Link>
          </div>
        );
      })}
    </nav>
  );
};
