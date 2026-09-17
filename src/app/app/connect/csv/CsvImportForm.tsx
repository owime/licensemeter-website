"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { Button } from "~/components/ui";
import { submitCsvImport, type CsvImportResult } from "./actions";

const inputClass =
  "min-h-11 w-full border border-line bg-card px-3 py-2 text-sm file:mr-3 file:cursor-pointer file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-canvas focus:border-ink";

/**
 * Two file inputs + optional workspace name, wrapped in useActionState so
 * parse/guard failures land in the aria-live region (ImportPricesForm
 * pattern). Success never returns: the action redirects to /app.
 */
export const CsvImportForm = () => {
  const t = useTranslations("connect.csv.form");
  const [result, formAction, pending] = useActionState(
    async (_prev: CsvImportResult | null, formData: FormData) =>
      submitCsvImport(formData),
    null,
  );

  return (
    <form
      action={formAction}
      aria-busy={pending || undefined}
      className="mt-8 flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="csv-import-directory" className="text-sm font-medium">
          {t("directoryLabel")}{" "}
          <span className="text-brand-text">{t("required")}</span>
        </label>
        <input
          id="csv-import-directory"
          name="directory"
          type="file"
          required
          disabled={pending}
          accept=".csv,text/csv"
          className={inputClass}
        />
        <p className="text-ink-soft text-xs">{t("directoryHelp")}</p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="csv-import-usage" className="text-sm font-medium">
          {t("usageLabel")}{" "}
          <span className="text-ink-faint">{t("optional")}</span>
        </label>
        <input
          id="csv-import-usage"
          name="usage"
          type="file"
          disabled={pending}
          accept=".csv,text/csv"
          className={inputClass}
        />
        <p className="text-ink-soft text-xs">{t("usageHelp")}</p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="csv-import-org-name" className="text-sm font-medium">
          {t("orgNameLabel")}{" "}
          <span className="text-ink-faint">{t("optional")}</span>
        </label>
        <input
          id="csv-import-org-name"
          name="orgName"
          type="text"
          maxLength={200}
          disabled={pending}
          placeholder={t("orgNamePlaceholder")}
          className={inputClass}
        />
      </div>

      <div>
        <Button variant="primary" disabled={pending}>
          {pending ? t("submitting") : t("submit")}
        </Button>
      </div>

      <p
        role="status"
        aria-live="polite"
        className={
          result && !result.ok ? "text-danger-text text-sm" : "sr-only"
        }
      >
        {result && !result.ok ? result.error : null}
      </p>
    </form>
  );
};
