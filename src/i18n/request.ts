import { getRequestConfig } from "next-intl/server";

import { getUserLocale } from "~/i18n/locale";

export default getRequestConfig(async () => {
  const locale = await getUserLocale();
  const messages = (
    (await import(`../../messages/${locale}.json`)) as {
      default: Record<string, unknown>;
    }
  ).default;
  return { locale, messages };
});
