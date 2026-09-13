"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavChild = { href: string; label: string };
type NavItem = {
  href: string;
  label: string;
  /** Extra routes that belong to this section, e.g. drill-downs. */
  also?: string[];
  /** Sub-pages shown while the section is active, one per connector. */
  children?: NavChild[];
};

const ITEMS: NavItem[] = [
  { href: "/app", label: "Overview" },
  { href: "/app/findings", label: "Findings", also: ["/app/users"] },
  { href: "/app/licenses", label: "Licenses & prices" },
  { href: "/app/renewals", label: "Renewals" },
  { href: "/app/ai-costs", label: "AI costs" },
  {
    href: "/app/settings",
    label: "Settings",
    children: [
      { href: "/app/settings/microsoft", label: "Microsoft 365" },
      { href: "/app/settings/adobe", label: "Adobe" },
      { href: "/app/settings/zoom", label: "Zoom" },
      { href: "/app/settings/atlassian", label: "Atlassian" },
      { href: "/app/settings/salesforce", label: "Salesforce" },
      { href: "/app/settings/openai", label: "OpenAI" },
      { href: "/app/settings/anthropic", label: "Anthropic" },
      { href: "/app/settings/chatgpt", label: "ChatGPT" },
      { href: "/app/settings/claude", label: "Claude" },
    ],
  },
];

const PORTFOLIO_ITEM: NavItem = { href: "/app/portfolio", label: "Portfolio" };

/** True for the route itself and its children, never for sibling prefixes. */
const inSection = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(href + "/");

export const NavLinks = ({
  onNavigate,
  showPortfolio = false,
  navLabel = "Workspace navigation",
}: {
  onNavigate?: () => void;
  showPortfolio?: boolean;
  /** Distinguishes the two render sites (desktop rail vs mobile drawer). */
  navLabel?: string;
}) => {
  const pathname = usePathname();

  const items = showPortfolio
    ? [...ITEMS.slice(0, 1), PORTFOLIO_ITEM, ...ITEMS.slice(1)]
    : ITEMS;
  return (
    <nav aria-label={navLabel} className="flex flex-col gap-0.5">
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
              : item.href === "/app/settings"
                ? "nav-settings"
                : undefined
            : undefined;
        // The parent is the current page only when no child is.
        const childCurrent = (item.children ?? []).find((c) =>
          inSection(pathname, c.href),
        );
        const parentCurrent = sectionActive && !childCurrent;
        return (
          <div key={item.href} className="flex flex-col gap-0.5">
            <Link
              href={item.href}
              data-tour={tourAnchor}
              onClick={onNavigate}
              aria-current={parentCurrent ? "page" : undefined}
              className={`border-l-2 px-[18px] py-2.5 text-sm transition ${
                parentCurrent
                  ? "border-brand bg-sidebar-line/70 text-canvas font-medium"
                  : sectionActive
                    ? "text-canvas border-transparent"
                    : "text-sidebar-soft hover:border-sidebar-soft hover:text-canvas border-transparent"
              }`}
            >
              {item.label}
            </Link>
            {sectionActive && item.children && (
              <div className="border-sidebar-line ml-4 border-l">
                {childCurrent && (
                  <Link
                    href={childCurrent.href}
                    onClick={onNavigate}
                    aria-current="page"
                    className="border-brand bg-sidebar-line/70 text-canvas block border-l-2 py-2 pr-4 pl-4 text-[13px] font-medium"
                  >
                    {childCurrent.label}
                  </Link>
                )}
                <details>
                  <summary className="text-sidebar-soft hover:text-canvas flex min-h-11 cursor-pointer touch-manipulation items-center px-4 text-[13px] font-medium">
                    {childCurrent ? "Other connectors" : "Connectors"}
                    <span className="ml-auto text-[11px]">
                      {item.children.length}
                    </span>
                  </summary>
                  <div className="flex flex-col pb-1">
                    {item.children
                      .filter((child) => child.href !== childCurrent?.href)
                      .map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onNavigate}
                          className="text-sidebar-soft hover:border-sidebar-soft hover:text-canvas border-l-2 border-transparent py-2 pr-4 pl-4 text-[13px] transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                  </div>
                </details>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};
