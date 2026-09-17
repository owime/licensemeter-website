import { getRequestConfig } from "next-intl/server";

import { getUserLocale } from "~/i18n/locale";
import { MESSAGE_NAMESPACES } from "../../messages/manifest";

export default getRequestConfig(async () => {
  const locale = await getUserLocale();
  const files = await Promise.all(
    MESSAGE_NAMESPACES.map(
      (namespace) =>
        import(`../../messages/${locale}/${namespace}.json`) as Promise<{
          default: Record<string, unknown>;
        }>,
    ),
  );
  const messages = Object.assign(
    {},
    ...files.map((file) => file.default),
  ) as Record<string, unknown>;
  return { locale, messages };
});
