"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { triggerSync } from "~/server/actions";

export const SyncNowButton = () => {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-xs text-rust">{error}</span>}
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await triggerSync();
            if (!result.ok) setError(result.error ?? "Sync failed");
            router.refresh();
          })
        }
        className="border border-line-strong bg-card px-3.5 py-2 text-xs font-medium tracking-wide uppercase transition hover:border-ink disabled:opacity-50"
      >
        {pending ? "Syncing…" : "Sync now"}
      </button>
    </div>
  );
};
