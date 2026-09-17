"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { buttonClass } from "~/components/ui";
import { updatePrice } from "~/server/actions";

export const PriceEditor = ({
  skuId,
  name,
  initial,
  currency,
}: {
  skuId: string;
  /** Human-readable product name for the aria-label; skuId is often a GUID. */
  name?: string;
  initial: string;
  currency: string;
}) => {
  const t = useTranslations("licenses");
  const [value, setValue] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  /* Re-sync if the server-confirmed price changes underneath us (e.g. the
     canonical "14.90" after saving "14.9"), so Save stays disabled. */
  useEffect(() => setValue(initial), [initial]);

  const dirty = value !== initial;

  return (
    <form
      className="flex items-center justify-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          try {
            const result = await updatePrice(skuId, value);
            setFailed(!result.ok);
            setMessage(
              result.ok
                ? t("priceEditor.saved")
                : (result.error ?? t("priceEditor.saveFailed")),
            );
            if (result.ok) router.refresh();
          } catch {
            setFailed(true);
            setMessage(t("priceEditor.saveFailed"));
          }
        });
      }}
    >
      <span className="text-ink-faint text-xs">{currency}</span>
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setMessage(null);
          setFailed(false);
        }}
        name={`price-${skuId}`}
        autoComplete="off"
        inputMode="decimal"
        aria-label={t("priceEditor.ariaLabel", { name: name ?? skuId })}
        className="tnum border-line bg-card focus:border-ink min-h-11 w-24 border px-2 py-1.5 text-right font-mono text-sm"
      />
      <button
        disabled={!dirty || pending}
        className={buttonClass("micro", "py-1.5")}
      >
        {pending ? t("priceEditor.saving") : t("priceEditor.save")}
      </button>
      {dirty && !pending && !message && (
        <span className="text-waste-text text-[11px] font-medium">
          {t("priceEditor.unsaved")}
        </span>
      )}
      <span
        aria-live="polite"
        className={`max-w-44 text-[11px] ${failed ? "text-danger-text" : "text-moss"}`}
      >
        {message}
      </span>
    </form>
  );
};
