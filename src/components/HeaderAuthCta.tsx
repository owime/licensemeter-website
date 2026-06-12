"use client";

import { useEffect, useState } from "react";

import { ButtonLink } from "~/components/ui";

/**
 * Session-aware header CTA, resolved client-side so the marketing pages can
 * stay statically rendered: the signed-out CTA renders immediately (the
 * common case for visitors) and swaps to "Open dashboard" once
 * /api/auth/session confirms a session.
 */
export const HeaderAuthCta = () => {
  const [signedIn, setSignedIn] = useState(false);

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

  return signedIn ? (
    <ButtonLink href="/app" variant="secondary" className="ml-1">
      Open dashboard
    </ButtonLink>
  ) : (
    /*
     * Wrapper span carries the responsive visibility: buttonClass hardcodes
     * inline-flex, which outranks `hidden` in the compiled stylesheet when
     * both sit on the same element.
     */
    <span className="ml-1 hidden sm:inline-flex">
      <ButtonLink href="/#get-started" variant="secondary">
        Free waste scan
      </ButtonLink>
    </span>
  );
};
