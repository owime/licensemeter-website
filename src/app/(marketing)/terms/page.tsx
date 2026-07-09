import type { Metadata } from "next";

import { TRIAL_DAYS } from "~/lib/plans";
import { SUPPORT_EMAIL } from "~/lib/support";

export const metadata: Metadata = {
  title: "Terms and Conditions",
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
 * Provider details are filled. Billing is live: the Service runs on a free scan
 * + TRIAL_DAYS-day trial + paid subscription model (see /pricing, ~/lib/plans),
 * so section 6 describes the trial and paid plans rather than a pre-billing
 * "free of charge" phase. Sign-in is WorkOS AuthKit (multi-method); Microsoft
 * Entra ID is one sign-in option and the tenant data connector. Pricing wording
 * must stay consistent with /pricing and the Privacy Policy. Still to do: have
 * the final text reviewed by a lawyer (this is a structured draft, not legal
 * advice). German law applies; the English text is provided for the product's
 * English-speaking audience.
 */
export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 pt-6 pb-24">
      <h1 className="font-display text-4xl tracking-tight">
        Terms and Conditions
      </h1>
      <p className="text-ink-faint mt-3 text-xs">Last updated: June 2026</p>

      <Section title="1. Scope and provider">
        <p>
          These Terms and Conditions govern the use of the online service
          LicenseMeter (the &ldquo;Service&rdquo;) by companies and other
          organizations (the &ldquo;Customer&rdquo;). The provider and
          contracting party is UgurLabs UG (haftungsbeschränkt), Fährstraße 217,
          40221 Düsseldorf, Germany, represented by its Managing Director Ugur
          Koc (the &ldquo;Provider&rdquo;). The Service is directed exclusively
          at businesses within the meaning of Section 14 of the German Civil
          Code (BGB), not at consumers.
        </p>
      </Section>

      <Section title="2. Description of the service">
        <p>
          LicenseMeter is an analytics service that surfaces unused and
          oversized software licenses. Once the Customer grants access, the
          Service connects via read-only permissions to the Customer&rsquo;s
          Microsoft 365 tenant and, optionally, to further source systems
          (including Adobe, Zoom, Atlassian, Salesforce, OpenAI and Anthropic)
          or to member lists the Customer imports by CSV (ChatGPT, Claude),
          evaluates license, seat and activity information, and presents it as
          analyses, reports and exports.
        </p>
        <p>
          The Provider owes no particular economic outcome. Analyses and savings
          suggestions are decision aids; responsibility for license changes
          remains with the Customer.
        </p>
      </Section>

      <Section title="3. Registration and access">
        <p>
          Sign-in is handled through our authentication provider (WorkOS
          AuthKit) and supports several methods, including a Microsoft work or
          school account, Google, Apple, a passkey, a one-time email link, or
          email and password. Connecting a Microsoft 365 tenant for analysis is
          a separate step: the Customer ensures that the individuals acting are
          authorized to grant the required administrator consent and to connect
          the tenant. The Customer may use the Provider&rsquo;s managed
          application or register its own application (&ldquo;bring your
          own&rdquo;); any credentials supplied for the latter are stored
          encrypted and used solely for the read-only sync. Access credentials
          must be kept confidential; the Customer is responsible for actions
          taken under its account.
        </p>
      </Section>

      <Section title="4. Connecting source systems; processing on your behalf">
        <p>
          When the Customer connects its tenant or further source systems, the
          Provider processes the data retrieved solely on the instructions and
          on behalf of the Customer (Art. 28 GDPR). A{" "}
          <a
            href="/dpa"
            className="hover:text-ink underline underline-offset-4"
          >
            data processing agreement (DPA)
          </a>{" "}
          is provided before production use and, in the event of a conflict
          regarding data processing, prevails over these Terms. Mailbox, file or
          message content is not read; access is technically limited to
          read-only permissions.
        </p>
      </Section>

      <Section title="5. Customer obligations">
        <p>
          The Customer uses the Service in compliance with applicable law and
          only for its own organizational data, or data it is authorized to
          process. The Customer refrains from interfering with the integrity or
          availability of the Service, from circumventing access controls, and
          from automated extraction beyond the functions provided.
        </p>
      </Section>

      <Section title="6. Prices and billing">
        <p>
          Every workspace starts with a free license scan and a {TRIAL_DAYS}-day
          trial of the full Service that begins when the first connector is
          connected; no payment method is required for the trial. Continued use
          beyond the trial requires a paid subscription, which the Customer
          selects expressly. Subscriptions are billed per connected Microsoft
          365 tenant at the plan prices shown on the{" "}
          <a
            href="/pricing"
            className="hover:text-ink underline underline-offset-4"
          >
            pricing page
          </a>{" "}
          at the time of order; all prices are net and exclusive of any
          statutory VAT, which is added where applicable. Billing and payment
          are handled by our payment processor (Stripe); the Provider does not
          store full card details. If the Customer does not subscribe, access to
          the paid functions is restricted after the trial while the workspace
          itself remains viewable.
        </p>
      </Section>

      <Section title="7. Availability and support">
        <p>
          The Provider strives for high availability of the Service but, absent
          a separate agreement, owes no particular availability (no service
          level). Maintenance, ongoing development and disruptions outside the
          Provider&rsquo;s control (in particular at third parties such as
          Microsoft or the connected source systems) may temporarily limit use.
          Support is provided by email at {SUPPORT_EMAIL}.
        </p>
      </Section>

      <Section title="8. Liability">
        <p>
          The Provider is liable without limitation for intent and gross
          negligence and for damage arising from injury to life, body or health.
          For simple negligence the Provider is liable only for breach of a
          material contractual obligation (cardinal obligation), and limited in
          amount to the foreseeable damage typical for this type of contract.
          Liability is otherwise excluded. Liability under the German Product
          Liability Act remains unaffected.
        </p>
      </Section>

      <Section title="9. Term and termination">
        <p>
          The usage relationship runs for an indefinite period. The Customer may
          end it at any time by disconnecting the workspace; on disconnect, all
          synchronized data is deleted immediately and in full (see Privacy
          Policy). A paid subscription can be cancelled at any time and then
          runs until the end of the current billing period; it is managed
          through the billing portal. The right to extraordinary termination for
          good cause remains unaffected for both parties.
        </p>
      </Section>

      <Section title="10. Changes to these Terms and to the service">
        <p>
          The Provider may amend these Terms and the scope of the Service with
          effect for the future where this is necessary for a valid reason (in
          particular a changed legal situation or technical development) and the
          Customer is not unreasonably disadvantaged. Changes are communicated
          to the Customer with reasonable notice. The version published at the
          time of use applies.
        </p>
      </Section>

      <Section title="11. Final provisions">
        <p>
          The law of the Federal Republic of Germany applies, excluding the UN
          Convention on Contracts for the International Sale of Goods. If the
          Customer is a merchant, a legal entity under public law or a special
          fund under public law, the exclusive place of jurisdiction is the
          Provider&rsquo;s registered seat. Should individual provisions of
          these Terms be invalid, the validity of the remaining provisions
          remains unaffected.
        </p>
      </Section>
    </main>
  );
}
