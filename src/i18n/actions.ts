"use server";

import { revalidatePath } from "next/cache";

import { type Locale } from "~/i18n/config";
import { setUserLocale } from "~/i18n/locale";

export async function changeLocale(locale: Locale) {
  await setUserLocale(locale);
  revalidatePath("/", "layout");
}
