import type { Metadata } from "next";

import { SUBPROCESSORS } from "~/lib/dpa";
import { SUPPORT_EMAIL } from "~/lib/support";

export const metadata: Metadata = {
  title: "Privacy Policy",
  robots: { index: false },
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="mt-8">
    <h2 className="text-ink font-medium">{title}</h2>
    <div className="text-ink-soft mt-2 flex flex-col gap-2 text-sm leading-relaxed">
      {children}
    </div>
  </section>
);

/*
 * Controller details are filled (UgurLabs UG, Düsseldorf). The subprocessor
 * list in section 6 is rendered from the definitive list in the DPA
 * (~/lib/dpa SUBPROCESSORS), so it cannot drift from /dpa, /security or
 * /trust-center. Sign-in is WorkOS AuthKit (multi-method; WorkOS is a US
 * subprocessor on SCCs) with Microsoft as one option; billing is live (Stripe),
 * so there is a dedicated billing-data section. The landing page no longer
 * collects visitor emails, so the old "email notification" section was removed.
 * Still to do: have the final text reviewed by a lawyer (this is a structured
 * draft, not legal advice).
 */
export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 pt-6 pb-24">
      <h1 className="font-display text-4xl tracking-tight">Privacy Policy</h1>
      <p className="text-ink-faint mt-3 text-xs">Last updated: June 2026</p>

      <Section title="1. Controller">
        <p>
          UgurLabs UG (haftungsbeschränkt)
          <br />
          Fährstraße 217, 40221 Düsseldorf, Germany
          <br />
          Managing Director: Ugur Koc
          <br />
          Email: {SUPPORT_EMAIL}
        </p>
      </Section>

      <Section title="2. Processing when you visit this website">
        <p>
          When you open this website, our hosting provider (Vercel Inc.)
          processes technically necessary data (IP address, time, page
          requested, user agent) in server logs in order to provide and secure
          the service (Art. 6(1)(f) GDPR). The application runs in EU data
          centers; a data processing agreement including the EU Standard
          Contractual Clauses is in place with Vercel.
        </p>
        <p>
          This website uses only technically necessary session cookies for
          sign-in. No tracking or marketing cookies are set. See our{" "}
          <a
            href="/cookies"
            className="hover:text-ink underline underline-offset-4"
          >
            Cookie Policy
          </a>{" "}
          for details.
        </p>
        <p>
          For reach measurement we use Vercel Web Analytics, a cookieless method
          that records only aggregated, anonymized page views (Art. 6(1)(f)
          GDPR). No cross-device profiles are built and no IP addresses are
          stored.
        </p>
      </Section>

      <Section title="3. Sign-in">
        <p>
          Sign-in is handled through our authentication provider, WorkOS, Inc.
          (AuthKit). Depending on the method you choose &mdash; a Microsoft work
          or school account, Google, Apple, a passkey, a one-time email link, or
          email and password &mdash; we process the profile data that method
          returns, in particular your display name and email address, together
          with the identifier WorkOS assigns to your account. Where you sign in
          with a Microsoft account, we additionally receive your Microsoft object
          ID and tenant ID. This data is required to provide the account
          (Art. 6(1)(b) GDPR).
        </p>
        <p>
          WorkOS processes this sign-in data in the United States; the transfer
          is based on the EU Standard Contractual Clauses (see the subprocessor
          list below). Sessions are then maintained by a first-party,
          HTTP-only cookie set by LicenseMeter (see our{" "}
          <a
            href="/cookies"
            className="hover:text-ink underline underline-offset-4"
          >
            Cookie Policy
          </a>
          ).
        </p>
      </Section>

      <Section title="4. Product data (processing on your behalf)">
        <p>
          When an organization connects its Microsoft 365 tenant, LicenseMeter
          processes the following data of the tenant&rsquo;s users on that
          organization&rsquo;s behalf (Art. 28 GDPR): display name, UPN, account
          status, user type, creation date, license assignments, last sign-in
          timestamp and the last activity date per service. Mailbox, file or
          message content is never read; access is technically limited to
          read-only permissions.
        </p>
        <p>
          If the organization additionally connects optional connectors,
          LicenseMeter processes, under the same engagement, the following data
          as well: member email addresses and product assignments from Adobe,
          Zoom, Atlassian and Salesforce; console member lists and daily API
          cost totals from OpenAI and Anthropic; and member lists pasted via CSV
          from ChatGPT and Claude.
        </p>
        <p>
          The data is stored in a Postgres database in the EU (Frankfurt region)
          and is deleted immediately and in full when the workspace is
          disconnected. Where the organization connects its Microsoft tenant
          using its own application registration (&ldquo;bring your own&rdquo;),
          the credentials it supplies are stored encrypted (AES-256-GCM) and used
          solely for the read-only sync; they are never logged or disclosed. A
          data processing agreement (DPA) is provided to each organization before
          production use.
        </p>
      </Section>

      <Section title="5. Billing data">
        <p>
          If an organization subscribes to a paid plan, our payment processor
          (Stripe) processes the data needed for billing &mdash; contact and
          billing details, the selected plan and payment information &mdash; to
          perform the contract (Art. 6(1)(b) GDPR). We store the subscription
          status and invoice metadata; we do not store full card numbers. Stripe
          retains invoice and transaction data for the period required by
          statutory tax and commercial-law retention duties, even after a
          workspace is disconnected. Stripe is listed among the subprocessors
          below.
        </p>
      </Section>

      <Section title="6. Subprocessors">
        <p>
          We engage the following subprocessors to process personal data on your
          behalf:
        </p>
        <ul className="flex flex-col gap-1.5">
          {SUBPROCESSORS.map((sp) => (
            <li key={sp.name} className="flex gap-2.5">
              <span aria-hidden="true" className="text-moss mt-0.5">
                ·
              </span>
              <span>
                <span className="text-ink">{sp.name}</span> — {sp.purpose},{" "}
                {sp.location} ({sp.basis}).
              </span>
            </li>
          ))}
        </ul>
        <p>
          The current list is part of the{" "}
          <a href="/dpa" className="hover:text-ink underline underline-offset-4">
            DPA
          </a>
          .
        </p>
        <p>
          To be distinguished from these are the source systems named in section
          4 (Adobe, Zoom, Atlassian, Salesforce, OpenAI, Anthropic, and the
          lists pasted via CSV from ChatGPT and Claude): LicenseMeter reads data
          from them, on the organization&rsquo;s behalf, on a read-only basis.
          They are data sources, not subprocessors of LicenseMeter; no personal
          data is shared with them beyond the authenticated read request.
        </p>
      </Section>

      <Section title="7. Retention">
        <p>
          Account and product data is stored for as long as the workspace is
          connected. On disconnect, all synchronized data is deleted; remaining
          copies in routine encrypted backups are overwritten within the backup
          rotation window (currently around seven days). Invoice and transaction
          data is retained by the payment processor for the statutory periods
          described in section 5. The hosting provider&rsquo;s server logs are
          subject to that provider&rsquo;s deletion periods.
        </p>
      </Section>

      <Section title="8. Your rights">
        <p>
          You have the right of access (Art. 15), rectification (Art. 16),
          erasure (Art. 17), restriction of processing (Art. 18), data
          portability (Art. 20) and objection (Art. 21 GDPR), as well as the
          right to lodge a complaint with a supervisory authority (Art. 77
          GDPR). For data we process on behalf of your organization, please
          contact your organization as the controller in the first instance.
        </p>
      </Section>

      <Section title="9. Contact">
        <p>Privacy questions: {SUPPORT_EMAIL}</p>
      </Section>
    </main>
  );
}
