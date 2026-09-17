import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("dashLayout.notFound");
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl tracking-tight">{t("title")}</h1>
      <p className="text-ink-soft mt-2 max-w-md text-sm">
        {t("description")}
      </p>
      <Link
        href="/app/findings"
        className="text-ink-soft hover:text-ink mt-4 inline-flex min-h-11 items-center text-xs underline-offset-4 hover:underline"
      >
        {t("backToFindings")}
      </Link>
    </div>
  );
}
