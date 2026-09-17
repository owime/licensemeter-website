"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "~/components/ui";
import { triggerSync } from "~/server/actions";

export const SyncNowButton = () => {
  const t = useTranslations("connectorsDash.syncButton");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex items-center gap-3">
      {/* Persistent live region; sr-only while empty so the button stays put. */}
      <span
        role="status"
        aria-live="polite"
        className={error ? "text-danger-text text-xs" : "sr-only"}
      >
        {error}
      </span>
      <Button
        variant="secondary"
        disabled={pending}
        title={t("title")}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await triggerSync();
            if (!result.ok) setError(result.error ?? t("syncFailed"));
            router.refresh();
          })
        }
      >
        {pending ? t("syncing") : t("syncNow")}
      </Button>
    </div>
  );
};
