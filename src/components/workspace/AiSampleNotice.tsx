import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function AiSampleNotice({ exitHref }: { exitHref?: string }) {
  const t = await getTranslations("aiCosts");
  return (
    <aside
      className="border-brand/20 bg-brand-soft text-brand-text mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-sm"
      aria-label="Sample data notice"
    >
      <div>
        <p className="font-semibold">{t("sampleNotice.title")}</p>
        <p className="mt-1">{t("sampleNotice.description")}</p>
      </div>
      {exitHref && (
        <Link
          href={exitHref}
          className="hover:text-ink inline-flex min-h-11 items-center font-medium underline underline-offset-4"
        >
          {t("sampleNotice.exitPreview")}
        </Link>
      )}
    </aside>
  );
}
