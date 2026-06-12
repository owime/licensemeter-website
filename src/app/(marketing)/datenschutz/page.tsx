import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
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
    <h2 className="font-medium text-ink">{title}</h2>
    <div className="mt-2 flex flex-col gap-2 text-sm leading-relaxed text-ink-soft">
      {children}
    </div>
  </section>
);

/*
 * TODO before launch: fill in the [bracketed] controller details, confirm the
 * subprocessor list, and have the final text reviewed (this is a structured
 * draft, not legal advice).
 */
export default function DatenschutzPage() {
  return (
    <main lang="de" className="mx-auto max-w-3xl px-6 pt-6 pb-24">
      <h1 className="font-display text-4xl tracking-tight">
        Datenschutzerklärung
      </h1>
      <p className="mt-3 text-xs text-ink-faint">Stand: Juni 2026</p>

      <Section title="1. Verantwortlicher">
        <p>
          [Vor- und Nachname]
          <br />
          [Straße und Hausnummer], [PLZ Ort], Deutschland
          <br />
          E-Mail: support@licensemeter.com
        </p>
      </Section>

      <Section title="2. Verarbeitung beim Besuch dieser Website">
        <p>
          Beim Aufruf dieser Website verarbeitet unser Hosting-Anbieter
          (Vercel Inc.) technisch notwendige Daten (IP-Adresse, Zeitpunkt,
          aufgerufene Seite, User-Agent) in Server-Logs zur Bereitstellung und
          Absicherung des Dienstes (Art. 6 Abs. 1 lit. f DSGVO). Die
          Anwendung wird in EU-Rechenzentren ausgeführt; mit Vercel besteht
          ein Auftragsverarbeitungsvertrag inklusive
          EU-Standardvertragsklauseln.
        </p>
        <p>
          Diese Website verwendet ausschließlich technisch notwendige
          Session-Cookies für die Anmeldung. Es werden keine Tracking- oder
          Marketing-Cookies gesetzt.
        </p>
        <p>
          Zur Reichweitenmessung setzen wir Vercel Web Analytics ein, ein
          cookiefreies Verfahren, das ausschließlich aggregierte, anonymisierte
          Seitenaufrufe erfasst (Art. 6 Abs. 1 lit. f DSGVO). Es werden keine
          geräteübergreifenden Profile gebildet und keine IP-Adressen
          gespeichert.
        </p>
      </Section>

      <Section title="3. Anmeldung mit Microsoft Entra ID">
        <p>
          Die Anmeldung erfolgt über Microsoft Entra ID (OpenID Connect).
          Dabei verarbeiten wir die von Microsoft übermittelten Profildaten:
          Anzeigename, E-Mail-Adresse/UPN, Objekt-ID und Tenant-ID. Diese
          Daten sind für die Bereitstellung des Kontos erforderlich (Art. 6
          Abs. 1 lit. b DSGVO).
        </p>
      </Section>

      <Section title="4. Produktdaten (Auftragsverarbeitung)">
        <p>
          Verbindet eine Organisation ihren Microsoft-365-Tenant, verarbeitet
          LicenseMeter im Auftrag dieser Organisation (Art. 28 DSGVO)
          folgende Daten der Tenant-Benutzer: Anzeigename, UPN, Kontostatus,
          Benutzertyp, Erstellungsdatum, Lizenzzuweisungen, Zeitstempel der
          letzten Anmeldung sowie Datum der letzten Aktivität je Dienst.
          Postfach-, Datei- oder Nachrichteninhalte werden zu keinem
          Zeitpunkt gelesen; der Zugriff ist technisch auf lesende
          Berechtigungen beschränkt.
        </p>
        <p>
          Die Daten werden in einer Postgres-Datenbank in der EU (Region
          Frankfurt) gespeichert und beim Trennen des Workspace unverzüglich
          und vollständig gelöscht. Ein Auftragsverarbeitungsvertrag (AVV)
          wird jeder Organisation vor Produktivnutzung bereitgestellt.
        </p>
      </Section>

      <Section title="4a. E-Mail-Benachrichtigung (Landing-Page)">
        <p>
          Wenn Sie auf der Startseite Ihre E-Mail-Adresse hinterlassen,
          speichern wir diese, um Ihnen die angeforderten Unterlagen
          (Security-Überblick) und eine einmalige Mitteilung zur allgemeinen
          Verfügbarkeit zuzusenden (Art. 6 Abs. 1 lit. b DSGVO). Es erfolgt
          kein automatisierter Newsletter-Versand. Die Adresse wird auf
          Anfrage jederzeit gelöscht.
        </p>
      </Section>

      <Section title="5. Subunternehmer (Auftragsverarbeiter)">
        <p>
          Vercel Inc. (Hosting, EU-Funktionsregion), Supabase Inc. (Datenbank,
          AWS eu-central-1 Frankfurt), Microsoft (Identitätsplattform und
          Graph API), Resend Inc. (E-Mail-Versand, EU-Region eu-west-1; nur
          Workspace-Benachrichtigungen an Administratoren). Die jeweils
          aktuelle Liste ist Bestandteil des AVV.
        </p>
      </Section>

      <Section title="6. Speicherdauer">
        <p>
          Konto- und Produktdaten werden gespeichert, solange der Workspace
          verbunden ist. Mit dem Trennen werden alle synchronisierten Daten
          gelöscht. Server-Logs des Hostings unterliegen den Löschfristen des
          Anbieters.
        </p>
      </Section>

      <Section title="7. Ihre Rechte">
        <p>
          Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16),
          Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18),
          Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21 DSGVO)
          sowie das Recht auf Beschwerde bei einer Aufsichtsbehörde (Art. 77
          DSGVO). Für Daten, die wir im Auftrag Ihrer Organisation
          verarbeiten, wenden Sie sich bitte zunächst an Ihre Organisation
          als Verantwortliche.
        </p>
      </Section>

      <Section title="8. Kontakt">
        <p>
          Fragen zum Datenschutz: support@licensemeter.com
        </p>
      </Section>
    </main>
  );
}
