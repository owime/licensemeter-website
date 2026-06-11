"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BrandMark } from "~/components/BrandMark";
import { NavLinks } from "./NavLinks";

/** Ink top bar + full-height drawer for viewports below lg. */
export const MobileNav = ({
  tenantName,
  isDemo,
  userName,
  role,
  showPortfolio = false,
}: {
  tenantName: string;
  isDemo: boolean;
  userName: string;
  role: string;
  showPortfolio?: boolean;
}) => {
  const [open, setOpen] = useState(false);

  /* Document-level so Escape closes the drawer regardless of where focus is. */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <header className="bg-sidebar sticky top-0 z-40 lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Link
          href="/app"
          className="font-display text-paper flex items-center gap-2 text-lg tracking-tight"
        >
          <BrandMark size={18} tone="dark" />
          <span>
            License<span className="text-rust-bright">Meter</span>
          </span>
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav-drawer"
          aria-label={open ? "Close menu" : "Open menu"}
          className="text-paper -my-1 flex size-11 items-center justify-center"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            {open ? (
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M3 6h14M3 10h14M3 14h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Stays mounted so the burger's aria-controls always resolves;
          Tailwind preflight gives [hidden] display:none !important. */}
      <div
        id="mobile-nav-drawer"
        hidden={!open}
        className="border-sidebar-line flex flex-col border-t pb-4"
      >
        <div className="px-4 py-3">
          <div className="text-paper truncate text-sm font-medium">
            {tenantName}
          </div>
          <div className="text-sidebar-soft mt-0.5 text-[11px] tracking-wider uppercase">
            {isDemo ? "Demo workspace" : "Connected tenant"}
          </div>
        </div>
        <NavLinks
          onNavigate={() => setOpen(false)}
          showPortfolio={showPortfolio}
        />
        <div className="border-sidebar-line mt-3 flex items-center justify-between border-t px-4 pt-3">
          <div className="min-w-0">
            <div className="text-paper truncate text-sm">{userName}</div>
            <div className="text-sidebar-soft text-[11px] tracking-wider uppercase">
              {role}
            </div>
          </div>
          <form action="/api/auth/signout" method="post">
            <button className="text-sidebar-soft hover:text-paper inline-flex min-h-11 items-center text-xs underline-offset-4 transition hover:underline">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
};
