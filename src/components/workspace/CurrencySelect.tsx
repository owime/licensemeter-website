"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { CURRENCY_LABELS, SUPPORTED_CURRENCIES } from "~/lib/currency";
import { setCurrency } from "~/server/actions";

export const CurrencySelect = ({ value }: { value: string }) => {
  const t = useTranslations("licenses");
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState(value);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const router = useRouter();

  useEffect(() => setSelected(value), [value]);

  const dirty = selected !== value;

  return (
    <form
      className="flex max-w-sm flex-col items-start gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!dirty || pending) return;
        setMessage("");
        setFailed(false);
        startTransition(async () => {
          try {
            const result = await setCurrency(selected);
            if (!result.ok) {
              setFailed(true);
              setMessage(result.error ?? t("currencySelect.conversionFailed"));
              return;
            }
            const rate = result.rate?.toLocaleString(undefined, {
              maximumFractionDigits: 6,
            });
            setMessage(
              rate && result.from && result.to && result.asOf
                ? t("currencySelect.converted", {
                    from: result.from,
                    rate,
                    to: result.to,
                    asOf: result.asOf,
                  })
                : t("currencySelect.updated"),
            );
            router.refresh();
          } catch {
            setFailed(true);
            setMessage(t("currencySelect.conversionFailedRetry"));
          }
        });
      }}
    >
      <div className="flex items-center gap-2">
        <select
          value={selected}
          name="currency"
          autoComplete="off"
          disabled={pending}
          aria-busy={pending || undefined}
          aria-label={t("currencySelect.ariaLabel")}
          onChange={(event) => {
            setSelected(event.target.value);
            setMessage("");
            setFailed(false);
          }}
          className="border-line bg-card focus:border-ink border px-2 py-1.5 text-sm disabled:opacity-60"
        >
          {SUPPORTED_CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {CURRENCY_LABELS[currency]}
            </option>
          ))}
        </select>
        {dirty && (
          <button
            type="submit"
            disabled={pending}
            className="border-ink bg-ink text-paper hover:bg-ink-soft border px-2.5 py-1.5 text-xs font-medium disabled:opacity-60"
          >
            {pending
              ? t("currencySelect.converting")
              : t("currencySelect.convert")}
          </button>
        )}
      </div>
      <p className="text-ink-faint text-xs leading-relaxed">
        {t("currencySelect.description")}
      </p>
      <p
        role="status"
        aria-live="polite"
        className={
          message
            ? `text-xs ${failed ? "text-danger-text" : "text-moss"}`
            : "sr-only"
        }
      >
        {message || t("currencySelect.noChangeInProgress")}
      </p>
    </form>
  );
};
