"use client";

import Link from "next/link";
import { useState } from "react";

import { NavLinks } from "./NavLinks";

/** Ink top bar + full-height drawer for viewports below lg. */
export const MobileNav = ({
  tenantName,
  isDemo,
  userName,
  role,
}: {
  tenantName: string;
  isDemo: boolean;
  userName: string;
  role: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-sidebar lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/app" className="font-display text-lg tracking-tight text-paper">
          License<span className="text-rust-bright">Meter</span>
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex size-9 items-center justify-center text-paper"
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

      {open && (
        <div className="flex flex-col border-t border-sidebar-line pb-4">
          <div className="px-4 py-3">
            <div className="truncate text-sm font-medium text-paper">
              {tenantName}
            </div>
            <div className="mt-0.5 text-[11px] tracking-wider text-sidebar-soft uppercase">
              {isDemo ? "Demo workspace" : "Connected tenant"}
            </div>
          </div>
          <NavLinks onNavigate={() => setOpen(false)} />
          <div className="mt-3 flex items-center justify-between border-t border-sidebar-line px-4 pt-3">
            <div className="min-w-0">
              <div className="truncate text-sm text-paper">{userName}</div>
              <div className="text-[11px] tracking-wider text-sidebar-soft uppercase">
                {role}
              </div>
            </div>
            <form action="/api/auth/signout" method="post">
              <button className="text-xs text-sidebar-soft underline-offset-4 hover:text-paper hover:underline">
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
