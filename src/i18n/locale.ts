import "server-only";

import { cookies } from "next/headers";

import { DEFAULT_LOCALE, LOCALES, type Locale } from "~/i18n/config";

export { LOCALES, DEFAULT_LOCALE };
export type { Locale };

const COOKIE_NAME = "locale";

const isLocale = (value: string | undefined): value is Locale =>
  LOCALES.includes(value as Locale);

/** Reads the visitor's chosen UI language. Defaults to English. */
export async function getUserLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Persists the visitor's chosen UI language for one year. */
export async function setUserLocale(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
}
