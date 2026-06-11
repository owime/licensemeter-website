import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum — LicenseMeter",
  robots: { index: false },
};

/*
 * TODO before launch (legally required, § 5 DDG):
 * replace every [bracketed] placeholder with the real details.
 */
export default function ImpressumPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 pt-6 pb-24">
      <h1 className="font-display text-4xl tracking-tight">Impressum</h1>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-ink-soft">
        <section>
          <h2 className="font-medium text-ink">Angaben gemäß § 5 DDG</h2>
          <p className="mt-2">
            [Vor- und Nachname]
            <br />
            [Straße und Hausnummer]
            <br />
            [PLZ Ort]
            <br />
            Deutschland
          </p>
        </section>

        <section>
          <h2 className="font-medium text-ink">Kontakt</h2>
          <p className="mt-2">
            E-Mail: support@your-domain.example
            <br />
            [Telefonnummer — optional]
          </p>
        </section>

        <section>
          <h2 className="font-medium text-ink">Umsatzsteuer-ID</h2>
          <p className="mt-2">
            Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: [USt-IdNr.,
            falls vorhanden]
          </p>
        </section>

        <section>
          <h2 className="font-medium text-ink">
            Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
          </h2>
          <p className="mt-2">[Vor- und Nachname, Anschrift wie oben]</p>
        </section>

        <section>
          <h2 className="font-medium text-ink">Hinweis</h2>
          <p className="mt-2">
            LicenseMeter ist ein unabhängiges Produkt und steht in keiner
            Verbindung zur Microsoft Corporation. Microsoft, Microsoft 365 und
            Entra ID sind Marken der Microsoft Corporation.
          </p>
        </section>
      </div>
    </main>
  );
}
