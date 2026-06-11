"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "~/components/ui";
import { triggerSync } from "~/server/actions";

export const SyncNowButton = () => {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-xs text-rust-text">{error}</span>}
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await triggerSync();
            if (!result.ok) setError(result.error ?? "Sync failed");
            router.refresh();
          })
        }
      >
        {pending ? "Syncing…" : "Sync now"}
      </Button>
    </div>
  );
};
