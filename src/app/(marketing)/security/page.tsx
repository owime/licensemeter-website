import type { Metadata } from "next";
import Link from "next/link";

import { CONNECTOR_SCOPES } from "~/lib/scopes";

export const metadata: Metadata = {
  title: "Security — LicenseMeter",
  description:
    "How LicenseMeter accesses Microsoft 365 tenants: read-only application permissions, EU data residency, deletion on disconnect, named subprocessors.",
};

const NEVER_ACCESSED = [
  "Mailbox content, attachments or calendars",
  "Files in OneDrive, SharePoint or Teams",
  "Teams messages or meeting content",
  "Passwords, credentials or security tokens of your users",
  "Any write access — LicenseMeter cannot change anything in your tenant",
];

const STORED_DATA = [
  "License SKUs with purchased and assigned seat counts",
  "Directory users: display name, UPN, enabled state, user type, creation date, assigned licenses",
  "Last sign-in timestamps (when your tenant has Entra ID P1) and per-workload last-activity dates",
  "The prices you enter in the price book and the findings derived from the above",
];

const Section = ({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) => (
  <section id={id} className="mt-12 scroll-mt-24">
    <h2 className="font-display text-2xl tracking-tight">{title}</h2>
    <div className="mt-4 text-sm leading-relaxed text-ink-soft">{children}</div>
  </section>
);

export default function SecurityPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 pt-6 pb-24">
      <p className="text-xs font-medium tracking-[0.2em] text-rust-text uppercase">
        Security overview
      </p>
      <h1 className="mt-4 font-display text-4xl tracking-tight">
        Written for the person who has to say yes.
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">
        LicenseMeter asks for tenant-wide read access, so this page spells out
        exactly what is granted, what is stored where, and how you leave. Share
        it with your security team before anyone clicks consent.
      </p>

      <Section title="How access works">
        <p>
          A Global Administrator of your tenant grants consent once, through
          Microsoft&apos;s standard admin-consent dialog. That authorizes the
          &quot;LicenseMeter Connector&quot; application for{" "}
          <strong className="text-ink">
            application permissions that are read-only without exception
          </strong>
          . LicenseMeter then syncs nightly using its own credential — no
          service account in your tenant, no agent, no mailbox plugin. You can
          revoke the application in Entra ID at any time, independently of us.
        </p>
        <ul className="mt-5 border border-line bg-card">
          {CONNECTOR_SCOPES.map((s) => (
            <li
              key={s.scope}
              className="flex flex-col gap-1 border-b border-line px-4 py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
            >
              <code className="font-mono text-xs text-ink">{s.scope}</code>
              <span className="text-xs">{s.why}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-faint">
          The consent is recorded in your tenant&apos;s audit log. Sign-in to
          the dashboard itself uses a separate app registration with only
          openid, profile and email.
        </p>
      </Section>

      <Section title="What LicenseMeter never accesses">
        <ul className="mt-2 flex flex-col gap-2">
          {NEVER_ACCESSED.map((item) => (
            <li key={item} className="flex gap-3">
              <span aria-hidden="true" className="mt-0.5 text-rust-text">×</span>
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4">
          Usage reports are consumed as counts and last-activity dates only —
          metadata, never content.
        </p>
      </Section>

      <Section title="What is stored">
        <ul className="mt-2 flex flex-col gap-2">
          {STORED_DATA.map((item) => (
            <li key={item} className="flex gap-3">
              <span aria-hidden="true" className="mt-0.5 text-moss">·</span>
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4">
          Access to a workspace is invite-based. Signing in with an account
          from your tenant grants nothing by itself; the admin who completed
          consent decides who sees the data and in which role.
        </p>
      </Section>

      <Section title="Data residency, retention and deletion">
        <p>
          All customer data is stored in the EU (Postgres, Frankfurt region).
          {/* TODO before launch: confirm the exact provider/region wording. */}{" "}
          Data is retained only while your tenant is connected. Disconnecting
          the workspace (Settings → Danger zone) deletes all synced data
          immediately and irreversibly — users, findings, prices, history.
          Revoking the enterprise application in your Entra ID additionally
          cuts our access at the source.
        </p>
      </Section>

      <Section id="subprocessors" title="Subprocessors">
        <ul className="mt-2 border border-line bg-card">
          {[
            ["Vercel Inc.", "Application hosting (EU function region)"],
            ["Neon / Supabase", "Postgres database, EU (Frankfurt)"],
            ["Microsoft", "Identity platform (sign-in, consent) and Graph API"],
          ].map(([name, role]) => (
            <li
              key={name}
              className="flex flex-col gap-1 border-b border-line px-4 py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between"
            >
              <span className="font-medium text-ink">{name}</span>
              <span className="text-xs">{role}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-faint">
          {/* TODO before launch: pick the actual database provider and remove the other. */}
          The definitive subprocessor list is part of the DPA.
        </p>
      </Section>

      <Section id="dpa" title="DPA / Auftragsverarbeitung">
        <p>
          LicenseMeter processes directory data on your behalf, so a data
          processing agreement under Art. 28 GDPR (AVV) is part of every
          subscription. Request the current version by email and receive a
          countersigned copy before you connect production data.
        </p>
      </Section>

      <Section title="Publisher verification">
        <p>
          The LicenseMeter app registrations are operated by a verified
          Microsoft partner publisher.
          {/* TODO before launch: set the real status once publisher verification completes. */}{" "}
          Microsoft shows the verified-publisher checkmark directly in the
          consent dialog, so your admin can confirm it independently of this
          page.
        </p>
      </Section>

      <Section title="Questions">
        <p>
          Security review, pentest coordination or vendor questionnaires:{" "}
          <a
            href="mailto:support@your-domain.example"
            className="font-medium text-ink underline underline-offset-4 hover:text-rust-text"
          >
            support@your-domain.example
          </a>
          . See also the{" "}
          <Link
            href="/faq"
            className="font-medium text-ink underline underline-offset-4 hover:text-rust-text"
          >
            FAQ
          </Link>{" "}
          and{" "}
          <Link
            href="/datenschutz"
            className="font-medium text-ink underline underline-offset-4 hover:text-rust-text"
          >
            Datenschutzerklärung
          </Link>
          .
        </p>
      </Section>
    </main>
  );
}
