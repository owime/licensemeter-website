"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { LOCALES, type Locale } from "~/i18n/config";
import { changeLocale } from "~/i18n/actions";

export const LanguageSwitcher = () => {
  const locale = useLocale();
  const t = useTranslations("languageSwitcher");
  const [isPending, startTransition] = useTransition();

  return (
    <label className="text-ink-soft inline-flex items-center gap-1.5 text-sm">
      <span className="sr-only">{t("label")}</span>
      <select
        value={locale}
        disabled={isPending}
        onChange={(event) => {
          const next = event.target.value as Locale;
          startTransition(() => {
            void changeLocale(next);
          });
        }}
        className="border-line-strong text-ink hover:border-brand bg-canvas -my-3 rounded-md border px-2 py-1 text-sm"
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {t(code)}
          </option>
        ))}
      </select>
    </label>
  );
};
