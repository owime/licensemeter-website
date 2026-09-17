"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("findings.statusControl");

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
        setMessage(result.error ?? t("genericError"));
        return;
      }
      setCurrent(next);
      setUndoTo(isUndo ? null : previous);
      setMessage(isUndo ? t("undone") : t("updated"));
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
        {pending
          ? t("updating")
          : current === "open"
            ? t("acknowledge")
            : t("reopen")}
      </button>
      {undoTo && !pending && (
        <button
          type="button"
          onClick={() => change(undoTo, true)}
          className="text-ink-soft hover:text-ink min-h-11 px-1 text-xs underline underline-offset-4"
        >
          {t("undo")}
        </button>
      )}
      <span
        role="status"
        aria-live="polite"
        className={message ? "text-ink-soft text-xs" : "sr-only"}
      >
        {message || t("noUpdateInProgress")}
      </span>
    </div>
  );
};
