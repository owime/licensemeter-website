import type { getTranslations } from "next-intl/server";

import type { DpaLang } from "~/lib/dpa";

/**
 * Content for the Trust Center. The German edition (server-rendered at
 * /de/trust-center) stays a static, hand-maintained structure below, exactly
 * as before. The English URL (/trust-center) instead sources its strings
 * from the "trustCenter" next-intl namespace
 * (messages/{en,no}/trustCenter.json), so the same URL renders in English or
 * Norwegian depending on the visitor's locale - see
 * buildTrustContentFromTranslations and its use in TrustCenterView. The
 * subprocessor rows are NOT duplicated here, they are read from ~/lib/dpa
 * (subprocessorRows) so the table stays sourced from the binding agreement -
 * that data currently has no Norwegian edition (~/lib/dpa is out of scope for
 * this change), so subprocessor names/purposes/locations render in English
 * even on the Norwegian-language page.
 */

type GlanceItem = { label: string; detail: string };
type DocItem = { href: string; label: string; detail: string };

/** A paragraph that embeds a single internal link. */
type LinkedText = { pre: string; linkText: string; href: string; post: string };

export type TrustContent = {
  eyebrow: string;
  h1: string;
  intro: string;
  toggleLabel: string;
  atAGlance: { title: string; items: GlanceItem[] };
  where: {
    title: string;
    intro: string;
    locationLabel: string;
    transferLabel: string;
    euLabel: string;
    usLabel: string;
    note: {
      pre: string;
      bold: string;
      mid: string;
      linkText: string;
      href: string;
      post: string;
    };
  };
  access: { title: string; body: string; linked: LinkedText };
  security: { title: string; body: string; linked: LinkedText };
  lifecycle: { title: string; linked: LinkedText };
  certs: { title: string; body1: string; body2: string };
  documents: { title: string; items: DocItem[] };
  questions: { title: string; body: string };
};

/** href per documents item, in JSON array order; not localized (see header note). */
const DOCUMENT_HREFS = ["/security", "/dpa", "/privacy", "/terms", "/cookies", "/faq"];

/**
 * Builds the English/Norwegian TrustContent from the "trustCenter" next-intl
 * namespace (messages/{en,no}/trustCenter.json). Hrefs are not localized
 * (there is no /no/ route tree), so they stay hardcoded here, matching the
 * English routes used throughout the marketing site regardless of locale.
 */
export const buildTrustContentFromTranslations = (
  t: Awaited<ReturnType<typeof getTranslations<"trustCenter">>>,
): TrustContent => ({
  eyebrow: t("eyebrow"),
  h1: t("h1"),
  intro: t("intro"),
  toggleLabel: t("toggleLabel"),
  atAGlance: {
    title: t("atAGlance.title"),
    items: t.raw("atAGlance.items") as GlanceItem[],
  },
  where: {
    title: t("where.title"),
    intro: t("where.intro"),
    locationLabel: t("where.locationLabel"),
    transferLabel: t("where.transferLabel"),
    euLabel: t("where.euLabel"),
    usLabel: t("where.usLabel"),
    note: {
      pre: t("where.note.pre"),
      bold: t("where.note.bold"),
      mid: t("where.note.mid"),
      linkText: t("where.note.linkText"),
      href: "/dpa#annex-3",
      post: t("where.note.post"),
    },
  },
  access: {
    title: t("access.title"),
    body: t("access.body"),
    linked: {
      pre: t("access.linked.pre"),
      linkText: t("access.linked.linkText"),
      href: "/security",
      post: t("access.linked.post"),
    },
  },
  security: {
    title: t("security.title"),
    body: t("security.body"),
    linked: {
      pre: t("security.linked.pre"),
      linkText: t("security.linked.linkText"),
      href: "/dpa#annex-2",
      post: t("security.linked.post"),
    },
  },
  lifecycle: {
    title: t("lifecycle.title"),
    linked: {
      pre: t("lifecycle.linked.pre"),
      linkText: t("lifecycle.linked.linkText"),
      href: "/privacy",
      post: t("lifecycle.linked.post"),
    },
  },
  certs: {
    title: t("certs.title"),
    body1: t("certs.body1"),
    body2: t("certs.body2"),
  },
  documents: {
    title: t("documents.title"),
    items: (t.raw("documents.items") as { label: string; detail: string }[]).map(
      (item, i) => ({ ...item, href: DOCUMENT_HREFS[i]! }),
    ),
  },
  questions: {
    title: t("questions.title"),
    body: t("questions.body"),
  },
});

const DE: TrustContent = {
  eyebrow: "Trust Center",
  h1: "Alles, was Ihr Sicherheitsteam braucht - an einem Ort.",
  intro:
    "LicenseMeter liest Lizenz- und Verzeichnis-Metadaten aus Ihrem Microsoft-365-Tenant - Vertrauen ist deshalb das eigentliche Produkt. Diese Seite fasst zusammen, wie wir auf Daten zugreifen, wo sie liegen, wer sie verarbeitet und welche Dokumente das belegen. Alle Angaben stammen aus denselben Vereinbarungen, die wir mit Ihnen schließen.",
  toggleLabel: "Sprache wählen",
  atAGlance: {
    title: "Auf einen Blick",
    items: [
      {
        label: "Nur-Lese-Zugriff",
        detail:
          "Die Anwendungsberechtigungen sind ausnahmslos nur lesend. Wir können in Ihrem Tenant nichts verändern.",
      },
      {
        label: "Datenhaltung in der EU",
        detail:
          "Kundendaten werden in der EU gespeichert, in einer Supabase-Postgres-Datenbank auf AWS eu-central-1 (Frankfurt).",
      },
      {
        label: "Löschung bei Trennung",
        detail:
          "Das Trennen eines Workspace löscht alle synchronisierten Daten sofort und unwiderruflich.",
      },
      {
        label: "DSGVO-AVV, vorunterzeichnet",
        detail:
          "Ein Auftragsverarbeitungsvertrag nach Art. 28 DSGVO gehört zu jedem Arbeitsbereich - herunterladbar und vorunterzeichnet.",
      },
      {
        label: "Durchgängig verschlüsselt",
        detail:
          "TLS bei der Übertragung, AES-256 im Ruhezustand und AES-256-GCM auf Anwendungsebene für Anmeldedaten von Drittanbietern.",
      },
      {
        label: "Analyse ohne Cookies",
        detail:
          "Keine Tracking- oder Marketing-Cookies, kein Consent-Banner. Aggregierte Vercel Web Analytics ohne IP-Speicherung.",
      },
    ],
  },
  where: {
    title: "Wo Ihre Daten liegen",
    intro:
      "Dies sind die Unterauftragsverarbeiter, die LicenseMeter einsetzt, mit ihrem Verarbeitungsort und dem jeweils einschlägigen Übermittlungsmechanismus. Die Liste wird aus dem verbindlichen Auftragsverarbeitungsvertrag erzeugt und entspricht somit stets der Liste, die Sie unterzeichnen.",
    locationLabel: "Standort",
    transferLabel: "Übermittlung",
    euLabel: "EU",
    usLabel: "EU + USA",
    note: {
      pre: "Optionale Quellsysteme, die Sie anbinden (Adobe, Zoom, Atlassian, Salesforce, OpenAI, Anthropic), und per CSV importierte Mitgliederlisten (ChatGPT, Claude) sind ",
      bold: "Datenquellen, keine Unterauftragsverarbeiter",
      mid: ": Wir lesen in Ihrem Auftrag aus ihnen und geben keine personenbezogenen Daten an sie weiter, die über die authentifizierte Leseanfrage hinausgehen. Die maßgebliche Liste ist ",
      linkText: "Anhang 3 des AVV",
      href: "/de/dpa#annex-3",
      post: ".",
    },
  },
  access: {
    title: "So funktioniert der Zugriff",
    body: "Ein globaler Administrator erteilt die Einwilligung einmalig über den standardmäßigen Administrator-Einwilligungsdialog von Microsoft - für Anwendungsberechtigungen, die ausnahmslos nur lesend sind. Es gibt kein Dienstkonto, keinen Agenten und kein Postfach-Plugin in Ihrem Tenant, und Sie können die Anwendung in Entra ID jederzeit unabhängig von uns widerrufen. Nutzungsberichte werden nur als Zählwerte und Datum der letzten Aktivität verarbeitet: Metadaten, niemals Inhalte.",
    linked: {
      pre: "Die ",
      linkText: "Sicherheitsübersicht",
      href: "/de/security",
      post: " listet jede angeforderte Berechtigung auf, was gespeichert wird und wie sich die Einwilligung ohne dauerhafte Rechte als globaler Administrator delegieren lässt.",
    },
  },
  security: {
    title: "Sicherheitsmaßnahmen",
    body: "Der Zugang zu einem Workspace erfolgt einladungs- und rollenbasiert (Inhaber, Administrator, Betrachter); die Anmeldung nutzt OpenID Connect mit PKCE sowie signierte, httpOnly- und kurzlebige Sitzungscookies. Daten werden bei der Übertragung (TLS, HSTS) und im Ruhezustand (AES-256) verschlüsselt; selbst bereitgestellte Connector-Anmeldedaten werden zusätzlich auf Anwendungsebene verschlüsselt (AES-256-GCM). Tenants sind durch Row-Level-Security logisch getrennt, zustandsändernde Anfragen sind CSRF-geschützt und ratenbegrenzt, und ein Audit-Log je Workspace protokolliert Exporte und administrative Aktionen.",
    linked: {
      pre: "Die vollständigen technischen und organisatorischen Maßnahmen finden Sie in ",
      linkText: "Anhang 2 des AVV",
      href: "/de/dpa#annex-2",
      post: ".",
    },
  },
  lifecycle: {
    title: "Datenlebenszyklus",
    linked: {
      pre: "Daten werden ausschließlich durch die nur lesende Synchronisierung erhoben, nur gespeichert, solange Ihr Tenant verbunden ist, und bei der Trennung gelöscht. Das Trennen eines Workspace (Einstellungen → Gefahrenzone) löscht alle synchronisierten Daten sofort und unwiderruflich: Benutzer, Ergebnisse, Preise, Verlauf und das Audit-Log. Das Widerrufen der Unternehmensanwendung in Ihrem Entra ID unterbindet unseren Zugriff zusätzlich an der Quelle. Einzelheiten zur Aufbewahrung und Ihre Betroffenenrechte finden Sie in der ",
      linkText: "Datenschutzerklärung",
      href: "/privacy",
      post: ".",
    },
  },
  certs: {
    title: "Zertifizierungen und Status",
    body1:
      "Unsere Unterauftragsverarbeiter werden nach dokumentierten Sicherheitsstandards ausgewählt und sind durch Auftragsverarbeitungsverträge gebunden; die oben genannten großen Infrastrukturanbieter verfügen über SOC-2- und/oder ISO-27001-Zertifizierungen, deren Berichte wir in einer Sicherheitsprüfung heranziehen können. LicenseMeter selbst verfügt noch nicht über eine eigene SOC-2-/ISO-27001-Zertifizierung.",
    body2:
      "Die Microsoft-Herausgeberverifizierung für die App-Registrierungen von LicenseMeter ist in Arbeit. Bis sie abgeschlossen ist, zeigt der Einwilligungsdialog die Apps als nicht verifiziert an; Microsoft zeigt den aktuellen Verifizierungsstatus direkt im Dialog an, sodass Ihr Administrator ihn jederzeit unabhängig überprüfen kann.",
  },
  documents: {
    title: "Dokumente",
    items: [
      {
        href: "/de/security",
        label: "Sicherheitsübersicht",
        detail:
          "Genau, was gewährt und gespeichert wird und wie Sie sich trennen. Nur-Lese-Berechtigungen, delegierte Einwilligung, Löschung.",
      },
      {
        href: "/de/dpa",
        label: "Auftragsverarbeitungsvertrag",
        detail:
          "AVV nach Art. 28 DSGVO, vorunterzeichnet. Download auf Deutsch oder Englisch mit vollständigem Unterauftragsverarbeiter-Anhang und TOM.",
      },
      {
        href: "/privacy",
        label: "Datenschutzerklärung",
        detail:
          "Was wir verarbeiten, auf welcher Rechtsgrundlage, wie lange und welche Betroffenenrechte gelten.",
      },
      {
        href: "/terms",
        label: "AGB",
        detail:
          "Der B2B-Servicevertrag. Bei allem, was die Datenverarbeitung betrifft, geht der AVV den AGB vor.",
      },
      {
        href: "/cookies",
        label: "Cookie-Richtlinie",
        detail:
          "Die funktionalen Cookies, die wir setzen, warum und wie lange sie gelten. Keine Tracking-Cookies.",
      },
      {
        href: "/faq",
        label: "FAQ",
        detail:
          "Verständliche Antworten auf die Fragen, die Sicherheits- und Identitätsteams am häufigsten stellen.",
      },
    ],
  },
  questions: {
    title: "Fragen",
    body: "Sicherheitsprüfungen, Pentest-Koordination und Lieferantenfragebögen: ",
  },
};

/**
 * Only the German edition is static content here. The English URL builds its
 * content from next-intl translations instead (see
 * buildTrustContentFromTranslations), because that is what lets /trust-center
 * render in Norwegian for Norwegian-locale visitors.
 */
export const TRUST_CONTENT: Record<Extract<DpaLang, "de">, TrustContent> = {
  de: DE,
};
