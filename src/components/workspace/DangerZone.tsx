"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import { disconnectTenant } from "~/server/actions";
import type { ActionResult } from "~/server/actions";

/**
 * Owner-only workspace deletion behind a type-the-name confirmation: the delete
 * button stays disabled until the workspace name is typed exactly, the strongest
 * guard for an irreversible deletion.
 */
export const DangerZone = ({ tenantName }: { tenantName: string }) => {
  const t = useTranslations("settings.dangerZone");
  const [confirmText, setConfirmText] = useState("");
  const [result, formAction, pending] = useActionState(
    async (_prev: ActionResult | null) => disconnectTenant(),
    null,
  );

  const confirmed = confirmText.trim() === tenantName.trim();

  return (
    <div className="border-danger-soft bg-card border">
      <div className="border-danger-soft border-b px-5 py-3">
        <h2 className="text-danger-text text-xs font-medium tracking-[0.18em] uppercase">
          {t("title")}
        </h2>
      </div>
      <div className="flex flex-col gap-4 px-5 py-4">
        <p className="text-ink-soft max-w-xl text-sm">
          {t("description", { tenantName })}
        </p>
        <form
          action={formAction}
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <label htmlFor="danger-confirm" className="sr-only">
            {t("confirmLabel")}
          </label>
          <input
            id="danger-confirm"
            type="text"
            autoComplete="off"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            onKeyDown={(e) => {
              // A single-input form submits on Enter even with the button
              // disabled; block it until the name matches so the gate holds.
              if (e.key === "Enter" && !confirmed) e.preventDefault();
            }}
            placeholder={t("confirmPlaceholder", { tenantName })}
            className="border-line bg-card focus:border-danger min-h-11 w-full border px-3 py-2 text-sm sm:max-w-xs"
          />
          <button
            type="submit"
            disabled={pending || !confirmed}
            className="border-danger text-danger-text hover:bg-danger-soft min-h-11 shrink-0 border px-4 py-2 text-xs font-medium tracking-wide uppercase disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? t("deleting") : t("deleteEverything")}
          </button>
        </form>
        {result && !result.ok && (
          <span
            role="status"
            aria-live="polite"
            className="text-danger-text text-xs"
          >
            {result.error ?? t("somethingWentWrong")}
          </span>
        )}
      </div>
    </div>
  );
};
