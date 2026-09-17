"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "~/components/ui";
import { importPrices } from "~/server/actions";
import type { ImportPricesResult } from "~/server/actions";

type ImportState = (ImportPricesResult & { csv?: string }) | null;

/** Outcome sentence(s) for the live region: applied, skipped, unparseable. */
const summary = (
  result: ImportPricesResult,
  t: ReturnType<typeof useTranslations<"licenses">>,
): string => {
  const parts: string[] = [];
  if (result.ok) {
    parts.push(t("importForm.applied", { count: result.applied }));
  } else {
    // Every part must be a full sentence so the join reads cleanly.
    const error = result.error ?? t("importForm.importFailed");
    parts.push(error.endsWith(".") ? error : `${error}.`);
  }
  if (result.skipped.length > 0) {
    const shown = result.skipped.slice(0, 8).join(", ");
    const more =
      result.skipped.length > 8
        ? t("importForm.andMore", { count: result.skipped.length - 8 })
        : "";
    parts.push(
      t("importForm.skipped", {
        count: result.skipped.length,
        shown,
        more,
      }),
    );
  }
  if (result.invalid > 0) {
    parts.push(t("importForm.invalid", { count: result.invalid }));
  }
  return parts.join(" ");
};

/**
 * Paste-CSV bulk price import. Wraps the importPrices server action in
 * useActionState so the per-row outcome surfaces in a live region; on
 * failure the pasted text survives the form reset (same remount trick as
 * the InviteForm).
 */
export const ImportPricesForm = () => {
  const t = useTranslations("licenses");
  const [result, formAction, pending] = useActionState(
    async (_prev: ImportState, formData: FormData): Promise<ImportState> => {
      const csv = formData.get("csv");
      const res = await importPrices(formData);
      return { ...res, csv: typeof csv === "string" ? csv : undefined };
    },
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="price-import-csv" className="text-ink-soft text-sm">
        {t.rich("importForm.label", {
          code: (chunks) => (
            <span className="font-mono text-xs">{chunks}</span>
          ),
        })}
      </label>
      <textarea
        // Remount on each new failure so defaultValue re-applies; resets after success.
        key={result && !result.ok ? (result.csv ?? "") : "clean"}
        id="price-import-csv"
        name="csv"
        required
        rows={6}
        spellCheck={false}
        placeholder={"ENTERPRISEPACK,12.80\nadobe:Photoshop,23,79"}
        defaultValue={result && !result.ok ? result.csv : undefined}
        className="border-line bg-card focus:border-ink w-full border px-3 py-2 font-mono text-sm"
      />
      <div>
        <Button variant="primary" disabled={pending}>
          {pending ? t("importForm.importing") : t("importForm.submit")}
        </Button>
      </div>
      <p
        role="status"
        aria-live="polite"
        className={
          result
            ? `text-xs ${result.ok ? "text-moss" : "text-danger-text"}`
            : "sr-only"
        }
      >
        {result === null ? null : summary(result, t)}
      </p>
    </form>
  );
};
