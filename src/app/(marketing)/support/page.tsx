import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import { SupportForm } from "~/components/SupportForm";
import { SupportChatButton } from "~/components/SupportChatButton";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "~/lib/support";

export const metadata: Metadata = {
  title: "Contact support",
  description:
    "Get help with LicenseMeter. Chat with us or send a support request to the Ugurlabs team.",
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  const configured = Boolean(
    process.env.RESEND_API_KEY &&
    process.env.SUPPORT_FROM_EMAIL &&
    process.env.SUPPORT_TURNSTILE_SITE_KEY &&
    process.env.SUPPORT_TURNSTILE_SECRET_KEY,
  );
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
      <p className="text-brand-text text-xs font-medium tracking-[0.12em] uppercase">
        Here to help
      </p>
      <h1 className="font-display mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
        Contact support
      </h1>
      <p className="text-ink-soft mt-5 max-w-xl text-lg leading-8">
        Need a hand with LicenseMeter? Tell us what you’re working on and where
        you got stuck.
      </p>
      <div className="mt-12 grid gap-12 lg:grid-cols-[1.5fr_1fr]">
        <section
          aria-label="Contact the team"
          className="border-line rounded-2xl border p-5 sm:p-8"
        >
          {configured ? (
            <SupportForm siteKey={process.env.SUPPORT_TURNSTILE_SITE_KEY!} />
          ) : (
            <>
              <h2 className="text-xl font-semibold tracking-tight">
                Let’s work it out together.
              </h2>
              <p className="text-ink-soft mt-4 text-sm leading-7">
                Open a conversation with our team using the chat below. You can
                also email us directly with your question.
              </p>
              <div className="mt-6">
                <SupportChatButton />
              </div>
            </>
          )}
          <div className="border-line mt-8 border-t pt-6">
            <p className="text-ink-soft flex items-center gap-2 text-sm">
              <Mail className="size-4" aria-hidden="true" />
              Prefer email?
            </p>
            <a
              href={SUPPORT_MAILTO}
              className="text-brand-text mt-2 inline-flex min-h-11 text-sm font-medium break-all underline underline-offset-4"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
        </section>
        <aside className="lg:pt-2">
          <h2 className="font-semibold">A good place to start</h2>
          <div className="divide-line mt-4 divide-y">
            {[
              {
                href: "/connectors",
                label: "Connect a tool",
                body: "Setup instructions and required permissions.",
              },
              {
                href: "/faq",
                label: "Frequently asked questions",
                body: "How scanning, findings and exports work.",
              },
              {
                href: "/status",
                label: "Service status",
                body: "Check the current availability of the service.",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group block py-5"
              >
                <span className="flex items-center justify-between gap-3 text-sm font-medium group-hover:underline">
                  {item.label}
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </span>
                <span className="text-ink-soft mt-2 block text-sm leading-6">
                  {item.body}
                </span>
              </Link>
            ))}
          </div>
          <p className="text-ink-faint mt-6 text-xs leading-6">
            Please leave passwords, access tokens and tenant exports out of your
            message. We use the details you share to respond to your request.{" "}
            <Link href="/privacy" className="underline underline-offset-4">
              Privacy policy
            </Link>
            .
          </p>
          {configured && (
            <div className="mt-6">
              <SupportChatButton />
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
