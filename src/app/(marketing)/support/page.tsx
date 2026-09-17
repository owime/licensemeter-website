import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SupportForm } from "~/components/SupportForm";
import { env } from "~/env";

export const metadata: Metadata = {
  title: "Contact support",
  description:
    "Get help with LicenseMeter. Send a support request to the Ugurlabs team.",
  alternates: { canonical: "/support" },
};

export default async function SupportPage() {
  const t = await getTranslations("support.page");
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <p className="text-brand-text text-xs font-medium tracking-[0.12em] uppercase">
        {t("eyebrow")}
      </p>
      <h1 className="font-display mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
        {t("title")}
      </h1>
      <p className="text-ink-soft mt-5 mb-10 max-w-xl text-lg leading-8">
        {t("intro")}
      </p>
      {env.SELF_HOSTED === "true" && !env.SUPPORT_TO_EMAIL ? (
        <p className="text-ink-soft border-line rounded-xl border p-5 text-sm">
          {t("selfHostedNotice")}
        </p>
      ) : (
        <SupportForm
          siteKey={process.env.SUPPORT_TURNSTILE_SITE_KEY}
          supportEmail={env.SUPPORT_TO_EMAIL}
        />
      )}
    </main>
  );
}
