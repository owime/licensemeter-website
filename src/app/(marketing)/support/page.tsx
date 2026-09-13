import type { Metadata } from "next";
import { SupportForm } from "~/components/SupportForm";

export const metadata: Metadata = {
  title: "Contact support",
  description:
    "Get help with LicenseMeter. Send a support request to the Ugurlabs team.",
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <p className="text-brand-text text-xs font-medium tracking-[0.12em] uppercase">
        Here to help
      </p>
      <h1 className="font-display mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
        Contact support
      </h1>
      <p className="text-ink-soft mt-5 mb-10 max-w-xl text-lg leading-8">
        Need a hand with LicenseMeter? Tell us what you’re working on and where
        you got stuck.
      </p>
      <SupportForm siteKey={process.env.SUPPORT_TURNSTILE_SITE_KEY} />
    </main>
  );
}
