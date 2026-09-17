"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "~/components/ui";
import type { ConnectorSpec } from "~/lib/connectors";
import { clearImportedSeats, importSeats } from "~/server/actions";
import type { ActionResult, ImportSeatsResult } from "~/server/actions";

type ImportState = (ImportSeatsResult & { csv?: string }) | null;

/** Outcome sentence(s) for the live region: imported count, unparseable lines. */
const summary = (
  result: ImportSeatsResult,
  t: ReturnType<typeof useTranslations>,
): string => {
  const parts: string[] = [];
  if (result.ok) {
    parts.push(
      t("imported", {
        count: result.imported,
        unit: result.imported === 1 ? t("seat") : t("seats"),
      }),
    );
  } else {
    parts.push(result.error ?? t("importFailed"));
  }
  if (result.invalid > 0) {
    parts.push(
      t("invalidLines", {
        count: result.invalid,
        unit: result.invalid === 1 ? t("line") : t("lines"),
      }),
    );
  }
  return parts.join(" ");
};

/**
 * Paste-CSV member import for the import-kind connectors (ChatGPT, Claude).
 * Wraps the importSeats server action in useActionState so the outcome
 * surfaces in a live region; on failure the pasted text survives the form
 * reset (same remount trick as the ImportPricesForm) and focus moves to the
 * error message.
 */
export const ImportSeatsForm = ({ spec }: { spec: ConnectorSpec }) => {
  const t = useTranslations("settings.importSeats");
  const statusRef = useRef<HTMLParagraphElement>(null);
  const [result, formAction, pending] = useActionState(
    async (_prev: ImportState, formData: FormData): Promise<ImportState> => {
      const csv = formData.get("csv");
      const res = await importSeats(formData);
      return { ...res, csv: typeof csv === "string" ? csv : undefined };
    },
    null,
  );

  /* Move focus to the failure message so keyboard and SR users land on it;
     the result object is new per submission so repeated errors re-focus. */
  useEffect(() => {
    if (result && !result.ok) statusRef.current?.focus();
  }, [result]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="provider" value={spec.provider} />
      <label
        htmlFor={`${spec.provider}-import-csv`}
        className="text-ink-soft text-sm"
      >
        {t("instructions", { label: spec.label })}
      </label>
      <textarea
        // Remount on each new failure so defaultValue re-applies; resets after success.
        key={result && !result.ok ? (result.csv ?? "") : "clean"}
        id={`${spec.provider}-import-csv`}
        name="csv"
        required
        rows={8}
        spellCheck={false}
        placeholder={t("placeholder")}
        defaultValue={result && !result.ok ? result.csv : undefined}
        autoComplete="off"
        className="border-line bg-card focus-visible:border-brand focus-visible:ring-brand/30 min-h-44 w-full border px-3 py-2 font-mono text-sm focus-visible:ring-2"
      />
      <div>
        <Button variant="primary" disabled={pending}>
          {pending ? t("importing") : spec.connectCta}
        </Button>
      </div>
      <p
        ref={statusRef}
        tabIndex={-1}
        role={result && !result.ok ? "alert" : "status"}
        aria-live={result?.ok ? "polite" : undefined}
        className={
          result
            ? `focus-visible:ring-brand text-xs focus-visible:ring-2 ${result.ok ? "text-moss" : "text-danger-text"}`
            : "sr-only"
        }
      >
        {result === null ? null : summary(result, t)}
      </p>
    </form>
  );
};

/**
 * Armed-confirm clear (same pattern as MemberActions): the first press arms
 * the button, the second one fires the action; failures surface in the live
 * region instead of being discarded.
 */
export const ClearSeatsButton = ({ spec }: { spec: ConnectorSpec }) => {
  const t = useTranslations("settings.importSeats");
  const [armed, setArmed] = useState(false);
  const [result, formAction, pending] = useActionState(
    async (_prev: ActionResult | null) => clearImportedSeats(spec.provider),
    null,
  );

  /* Disarm when the confirm click does not come within ~5s. */
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 5000);
    return () => clearTimeout(t);
  }, [armed]);

  const message = armed
    ? t("clearWarning", { label: spec.label })
    : result && !result.ok
      ? (result.error ?? t("somethingWentWrong"))
      : null;

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        /* First submit arms only; the second one fires the action. */
        if (!armed) {
          e.preventDefault();
          setArmed(true);
        } else {
          setArmed(false);
        }
      }}
      className="flex flex-col items-end gap-1"
    >
      <Button disabled={pending} onBlur={() => setArmed(false)}>
        {pending
          ? t("removing")
          : armed
            ? t("confirmClear")
            : t("clearImportedSeats")}
      </Button>
      <span
        role="status"
        aria-live="polite"
        className={
          message ? "text-danger-text max-w-64 text-right text-xs" : "sr-only"
        }
      >
        {message}
      </span>
    </form>
  );
};
