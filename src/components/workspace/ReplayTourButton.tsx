"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";

import { tourStorageKey } from "~/lib/tourStorage";
import { resetTour } from "~/server/actions";
import type { ActionResult } from "~/server/actions";

export const ReplayTourButton = ({ storageId }: { storageId: string }) => {
  const t = useTranslations("tour.replay");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const inFlight = useRef(false);
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <button
        type="button"
        disabled={pending}
        aria-busy={pending || undefined}
        onClick={() => {
          if (inFlight.current) return;
          inFlight.current = true;
          setResult(null);
          startTransition(async () => {
            try {
              const res = await resetTour();
              setResult(res);
              if (res.ok) {
                try {
                  window.localStorage.removeItem(
                    tourStorageKey(storageId, "welcome"),
                  );
                  window.localStorage.removeItem(
                    tourStorageKey(storageId, "data"),
                  );
                } catch {
                  // The reset still succeeds when browser storage is blocked.
                }
                router.refresh();
                router.push("/app");
              }
            } finally {
              inFlight.current = false;
            }
          });
        }}
        className="text-ink hover:text-brand-text inline-flex min-h-11 cursor-pointer touch-manipulation items-center text-sm font-medium underline-offset-4 transition hover:underline disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t("label")}
      </button>
      <span
        role="status"
        aria-live="polite"
        className={
          result
            ? `text-xs ${result.ok ? "text-moss" : "text-danger-text"}`
            : "sr-only"
        }
      >
        {result === null
          ? null
          : result.ok
            ? t("success")
            : (result.error ?? t("failure"))}
      </span>
    </div>
  );
};
