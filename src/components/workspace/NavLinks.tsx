"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/app", label: "Overview" },
  { href: "/app/findings", label: "Findings" },
  { href: "/app/licenses", label: "Licenses & prices" },
  { href: "/app/settings", label: "Settings" },
];

const PORTFOLIO_ITEM = { href: "/app/portfolio", label: "Portfolio" };

export const NavLinks = ({
  onNavigate,
  showPortfolio = false,
}: {
  onNavigate?: () => void;
  showPortfolio?: boolean;
}) => {
  const pathname = usePathname();
  const items = showPortfolio
    ? [...ITEMS.slice(0, 1), PORTFOLIO_ITEM, ...ITEMS.slice(1)]
    : ITEMS;
  return (
    <nav aria-label="Workspace" className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active =
          item.href === "/app"
            ? pathname === "/app"
            : item.href === "/app/findings"
              ? // The per-user drill-down is reached from findings.
                pathname.startsWith("/app/findings") ||
                pathname.startsWith("/app/users")
              : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`border-l-2 px-[18px] py-2.5 text-sm transition ${
              active
                ? "border-rust bg-sidebar-line/70 font-medium text-paper"
                : "border-transparent text-sidebar-soft hover:border-sidebar-soft hover:text-paper"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};
