"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { ButtonLink } from "~/components/ui";

/**
 * Session-aware header CTA, resolved client-side so the marketing pages can
 * stay statically rendered: the signed-out CTA renders immediately (the
 * common case for visitors) and swaps to "Open dashboard" once
 * /api/auth/session confirms a session.
 */
export const HeaderAuthCta = () => {
  const [signedIn, setSignedIn] = useState(false);
  const german = usePathname().startsWith("/de/");
  const t = useTranslations("headerAuthCta");

  useEffect(() => {
    const ctrl = new AbortController();
    const probe = async () => {
      try {
        const res = await fetch("/api/auth/session", { signal: ctrl.signal });
        if (!res.ok) return;
        const data = (await res.json()) as { signedIn?: boolean };
        if (data.signedIn) setSignedIn(true);
      } catch {
        // Network error or abort: keep the signed-out CTA.
      }
    };
    void probe();
    return () => ctrl.abort();
  }, []);

  /* Always visible: on mobile the nav links live in the burger drawer, so
     the action keeps its header slot. The compact labels below 341px keep
     brand + CTA + burger on one line through the 320px reflow target. */
  return signedIn ? (
    <ButtonLink href="/app" variant="ink">
      <span className="min-[341px]:hidden">{t("appShort")}</span>
      <span className="hidden min-[341px]:inline sm:hidden">
        {t("dashboardShort")}
      </span>
      <span className="hidden sm:inline">
        {german ? "Dashboard öffnen" : t("openDashboard")}
      </span>
    </ButtonLink>
  ) : (
    <ButtonLink href="/#get-started" variant="ink">
      <span className="min-[341px]:hidden">{t("startShort")}</span>
      <span className="hidden min-[341px]:inline">
        {german ? "Kostenlos starten" : t("startFree")}
      </span>
    </ButtonLink>
  );
};
