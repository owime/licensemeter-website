"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/app", label: "Overview" },
  { href: "/app/findings", label: "Findings" },
  { href: "/app/licenses", label: "Licenses & prices" },
  { href: "/app/settings", label: "Settings" },
];

export const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => {
  const pathname = usePathname();
  return (
    <nav aria-label="Workspace" className="flex flex-col gap-0.5">
      {ITEMS.map((item) => {
        const active =
          item.href === "/app"
            ? pathname === "/app"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`border-l-2 px-4 py-2.5 text-sm transition ${
              active
                ? "border-rust bg-sidebar-line/40 font-medium text-paper"
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
