"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Right-edge slide-in panel for detail/drill-down content. Always mounted so
 * the open/close transition animates both ways; when closed it sits off-screen
 * (translate-x-full) and is marked inert so it stays out of the tab order.
 *
 * Focus, Escape, body-scroll-lock and focus-return mirror the dashboard
 * MobileNav so behaviour is consistent across the app.
 */
export const Drawer = ({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  const t = useTranslations("dashLayout.drawer");
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // The element that had focus before opening, so it can be restored on close.
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const active = document.activeElement;
      const inside =
        active instanceof HTMLElement && panelRef.current.contains(active);
      if (
        e.shiftKey ? active === first || !inside : active === last || !inside
      ) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = prevOverflow;
      restoreRef.current?.focus();
    };
  }, [open, onClose]);

  return (
    <div aria-hidden={!open}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`bg-ink/30 fixed inset-0 z-50 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        inert={!open}
        className={`bg-card shadow-float fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="border-line flex items-center justify-between gap-4 border-b px-5 py-4">
          <h2 className="font-display text-xl tracking-tight">{title}</h2>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label={t("close")}
            className="text-ink-faint hover:text-ink hover:bg-subtle focus-visible:ring-brand -my-2 -mr-2 flex size-11 cursor-pointer touch-manipulation items-center justify-center rounded-lg transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {children}
        </div>
      </div>
    </div>
  );
};
