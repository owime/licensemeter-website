"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useTransition } from "react";

import { Button } from "~/components/ui";
import type { ConnectorSpec } from "~/lib/connectors";
import { clearImportedSeats, importSeats } from "~/server/actions";
import type { ImportSeatsResult } from "~/server/actions";

type ImportState = (ImportSeatsResult & { csv?: string }) | null;

const plural = (n: number, word: string) => (n === 1 ? word : `${word}s`);

/** Outcome sentence(s) for the live region: imported count, unparseable lines. */
const summary = (result: ImportSeatsResult): string => {
  const parts: string[] = [];
  if (result.ok) {
    parts.push(
      `Imported ${result.imported} ${plural(result.imported, "seat")}.`,
    );
  } else {
    parts.push(result.error ?? "Import failed.");
  }
  if (result.invalid > 0) {
    parts.push(
      `${result.invalid} ${plural(result.invalid, "line")} could not be parsed.`,
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
        className="text-sm text-ink-soft"
      >
        Paste the member table from the {spec.label} admin panel including its
        header row — copied web tables and CSV exports both work. An email
        column is required; name, status, plan and last-active columns are
        picked up when present. A new import replaces the current snapshot.
      </label>
      <textarea
        // Remount on each new failure so defaultValue re-applies; resets after success.
        key={result && !result.ok ? (result.csv ?? "") : "clean"}
        id={`${spec.provider}-import-csv`}
        name="csv"
        required
        rows={8}
        spellCheck={false}
        placeholder={
          "Email,Name,Status,Last active\njane@example.com,Jane Fox,active,2026-05-28"
        }
        defaultValue={result && !result.ok ? result.csv : undefined}
        className="w-full border border-line bg-card px-3 py-2 font-mono text-sm focus:border-ink"
      />
      <div>
        <Button variant="primary" disabled={pending}>
          {pending ? "Importing…" : spec.connectCta}
        </Button>
      </div>
      <p
        ref={statusRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className={
          result
            ? `text-xs focus:outline-none ${result.ok ? "text-moss" : "text-rust-text"}`
            : "sr-only"
        }
      >
        {result === null ? null : summary(result)}
      </p>
    </form>
  );
};

/** Mirrors SaasDisconnectButton: useTransition + refresh, no confirm step. */
export const ClearSeatsButton = ({ spec }: { spec: ConnectorSpec }) => {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await clearImportedSeats(spec.provider);
          router.refresh();
        })
      }
    >
      {pending ? "Removing…" : "Clear imported seats"}
    </Button>
  );
};
