"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { buttonClass } from "~/components/ui";
import { setFindingStatus } from "~/server/actions";

export const FindingStatusControl = ({
  findingId,
  initial,
}: {
  findingId: string;
  initial: "open" | "acknowledged";
}) => {
  const [current, setCurrent] = useState(initial);
  const [undoTo, setUndoTo] = useState<"open" | "acknowledged" | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => setCurrent(initial), [initial]);
  useEffect(() => {
    if (!undoTo) return;
    const timer = setTimeout(() => setUndoTo(null), 5_000);
    return () => clearTimeout(timer);
  }, [undoTo]);

  const change = (next: "open" | "acknowledged", isUndo = false) => {
    const previous = current;
    setMessage("");
    startTransition(async () => {
      const result = await setFindingStatus(findingId, next);
      if (!result.ok) {
        setMessage(
          result.error ?? "Could not update this finding. Please retry.",
        );
        return;
      }
      setCurrent(next);
      setUndoTo(isUndo ? null : previous);
      setMessage(isUndo ? "Change undone." : "Finding updated.");
      router.refresh();
    });
  };

  const next = current === "open" ? "acknowledged" : "open";
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => change(next)}
        className={buttonClass("micro")}
      >
        {pending ? "Updating…" : current === "open" ? "Acknowledge" : "Reopen"}
      </button>
      {undoTo && !pending && (
        <button
          type="button"
          onClick={() => change(undoTo, true)}
          className="text-ink-soft hover:text-ink min-h-11 px-1 text-xs underline underline-offset-4"
        >
          Undo
        </button>
      )}
      <span
        role="status"
        aria-live="polite"
        className={message ? "text-ink-soft text-xs" : "sr-only"}
      >
        {message || "No finding update in progress."}
      </span>
    </div>
  );
};
