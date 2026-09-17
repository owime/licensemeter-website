import type { getTranslations } from "next-intl/server";

import type { DpaLang } from "~/lib/dpa";

/**
 * Content for the security overview. The German edition (server-rendered at
 * /de/security) stays a static, hand-maintained structure below, exactly as
 * before. The English URL (/security) instead sources its strings from the
 * "security" next-intl namespace (messages/{en,no}/security.json), so the
 * same URL renders in English or Norwegian depending on the visitor's
 * locale - see buildContentFromTranslations and its use in SecurityView. The
 * scope table and the delegate-consent PowerShell script stay sourced from
 * ~/lib/scopes (CONNECTOR_SCOPES) in SecurityView; only the human-language
 * strings live here. The script's comments remain English in both editions,
 * as is customary for code.
 */

/** A paragraph that embeds a single internal link. */
type LinkedText = { pre: string; linkText: string; href: string; post: string };

export type SecurityContent = {
  eyebrow: string;
  h1: string;
  intro: string;
  toggleLabel: string;
  access: {
    title: string;
    /** Paragraph with a bold run in the middle. */
    body: { pre: string; strong: string; post: string };
    /**
     * Localized "why" per Graph scope, keyed by scope name. Missing keys fall
     * back to the English text in CONNECTOR_SCOPES, so a newly added scope can
     * never render blank.
     */
    scopeWhy: Partial<Record<string, string>>;
    consentNote: string;
  };
  delegate: {
    title: string;
    /** Paragraph with the scope count interpolated between pre and post. */
    body: { pre: string; post: string };
    connectorIdNote: string;
    csv: LinkedText;
  };
  never: { title: string; items: string[]; note: string };
  stored: { title: string; items: string[]; note: string };
  residency: { title: string; body: string };
  subprocessors: { title: string; note: LinkedText };
  dpa: { title: string; body: LinkedText };
  publisher: { title: string; body: string };
  who: {
    title: string;
    pre: string;
    kocLabel: string;
    mid: string;
    impressumLabel: string;
    post: string;
  };
  questions: {
    title: string;
    body: string;
    seeAlso: {
      pre: string;
      faqLabel: string;
      mid: string;
      privacyLabel: string;
      post: string;
    };
  };
};

/**
 * Builds the English/Norwegian SecurityContent from the "security" next-intl
 * namespace (messages/{en,no}/security.json). Hrefs are not localized (there
 * is no /no/ route tree), so they stay hardcoded here, matching the English
 * routes used throughout the marketing site regardless of locale.
 */
export const buildSecurityContentFromTranslations = (
  t: Awaited<ReturnType<typeof getTranslations<"security">>>,
): SecurityContent => ({
  eyebrow: t("eyebrow"),
  h1: t("h1"),
  intro: t("intro"),
  toggleLabel: t("toggleLabel"),
  access: {
    title: t("access.title"),
    body: {
      pre: t("access.body.pre"),
      strong: t("access.body.strong"),
      post: t("access.body.post"),
    },
    scopeWhy: t.raw("access.scopeWhy") as Partial<Record<string, string>>,
    consentNote: t("access.consentNote"),
  },
  delegate: {
    title: t("delegate.title"),
    body: {
      pre: t("delegate.body.pre"),
      post: t("delegate.body.post"),
    },
    connectorIdNote: t("delegate.connectorIdNote"),
    csv: {
      pre: t("delegate.csv.pre"),
      linkText: t("delegate.csv.linkText"),
      href: "/app/connect/csv",
      post: t("delegate.csv.post"),
    },
  },
  never: {
    title: t("never.title"),
    items: t.raw("never.items") as string[],
    note: t("never.note"),
  },
  stored: {
    title: t("stored.title"),
    items: t.raw("stored.items") as string[],
    note: t("stored.note"),
  },
  residency: {
    title: t("residency.title"),
    body: t("residency.body"),
  },
  subprocessors: {
    title: t("subprocessors.title"),
    note: {
      pre: t("subprocessors.note.pre"),
      linkText: t("subprocessors.note.linkText"),
      href: "/dpa#annex-3",
      post: t("subprocessors.note.post"),
    },
  },
  dpa: {
    title: t("dpa.title"),
    body: {
      pre: t("dpa.body.pre"),
      linkText: t("dpa.body.linkText"),
      href: "/dpa",
      post: t("dpa.body.post"),
    },
  },
  publisher: {
    title: t("publisher.title"),
    // TODO: update this wording the day verification completes.
    body: t("publisher.body"),
  },
  who: {
    title: t("who.title"),
    pre: t("who.pre"),
    kocLabel: t("who.kocLabel"),
    mid: t("who.mid"),
    impressumLabel: t("who.impressumLabel"),
    post: t("who.post"),
  },
  questions: {
    title: t("questions.title"),
    body: t("questions.body"),
    seeAlso: {
      pre: t("questions.seeAlso.pre"),
      faqLabel: t("questions.seeAlso.faqLabel"),
      mid: t("questions.seeAlso.mid"),
      privacyLabel: t("questions.seeAlso.privacyLabel"),
      post: t("questions.seeAlso.post"),
    },
  },
});

const DE: SecurityContent = {
  eyebrow: "Sicherheitsübersicht",
  h1: "Geschrieben für die Person, die Ja sagen muss.",
  intro:
    "LicenseMeter bittet um mandantenweiten Lesezugriff. Diese Seite legt deshalb offen, was genau gewährt wird, was wo gespeichert wird und wie Sie wieder gehen. Teilen Sie sie mit Ihrem Sicherheitsteam, bevor jemand auf Einwilligen klickt.",
  toggleLabel: "Sprache wählen",
  access: {
    title: "So funktioniert der Zugriff",
    body: {
      pre: "Ein globaler Administrator Ihres Tenants erteilt die Einwilligung einmalig über den standardmäßigen Administrator-Einwilligungsdialog von Microsoft. Damit wird die Anwendung „LicenseMeter Connector“ für ",
      strong:
        "Anwendungsberechtigungen autorisiert, die ausnahmslos nur lesend sind",
      post: ". LicenseMeter synchronisiert anschließend nächtlich mit eigenen Zugangsdaten: kein Dienstkonto in Ihrem Tenant, kein Agent, kein Postfach-Plugin. Sie können die Anwendung in Entra ID jederzeit unabhängig von uns widerrufen.",
    },
    scopeWhy: {
      "User.Read.All": "Verzeichnisnutzer, Kontostatus, zugewiesene Lizenzen",
      "AuditLog.Read.All":
        "Zeitstempel der letzten Anmeldung (erfordert Entra ID P1)",
      "Reports.Read.All": "Nutzungs- und Copilot-Aktivitätsberichte",
      "LicenseAssignment.Read.All": "gekaufte vs. zugewiesene Lizenzplätze",
      "ReportSettings.Read.All": "ob Namen in Berichten verborgen sind",
    },
    consentNote:
      "Die Einwilligung wird im Audit-Log Ihres Tenants protokolliert. Die Anmeldung am Dashboard selbst nutzt eine separate App-Registrierung mit lediglich openid, profile und email.",
  },
  delegate: {
    title:
      "Einwilligung delegieren ohne dauerhafte Rechte als globaler Administrator",
    body: {
      pre: "Die mandantenweite Administrator-Einwilligung für Microsoft-Graph-Anwendungsberechtigungen (wie oben aufgeführt) kann ein globaler Administrator oder ein Administrator für privilegierte Rollen erteilen; ein Anwendungsadministrator reicht für Graph-Anwendungsberechtigungen nicht aus - eine Grenze, die Microsoft setzt, nicht wir. Entra ID erlaubt es aber, diese Einwilligung eng begrenzt zu delegieren: eine App-Einwilligungsrichtlinie, festgelegt auf exakt diese ",
      post: " Nur-Lese-Berechtigungen und auf die LicenseMeter-Connector-App, verknüpft mit einer benutzerdefinierten Verzeichnisrolle. Die einmalige Einrichtung selbst erfordert einen Administrator für privilegierte Rollen oder globalen Administrator sowie Microsoft Graph PowerShell (die Rollenberechtigung lässt sich im Entra-Portal noch nicht hinzufügen) und gehört in die Prüfung Ihres Identity-Teams.",
    },
    connectorIdNote:
      "Die Connector-Anwendungs-ID wird auf der Verbindungsseite und im Einwilligungsdialog von Microsoft angezeigt.",
    csv: {
      pre: "Gerade keine Rolle mit Einwilligungsrechten zur Hand? Der ",
      linkText: "CSV-Import",
      href: "/app/connect/csv",
      post: " berechnet Ihre Verschwendungssumme aus zwei Exporten des Microsoft 365 Admin Centers, ganz ohne Einwilligung. Der Link meldet Sie zunächst mit Microsoft an.",
    },
  },
  never: {
    title: "Worauf LicenseMeter niemals zugreift",
    items: [
      "Postfachinhalte, Anhänge oder Kalender",
      "Dateien in OneDrive, SharePoint oder Teams",
      "Teams-Nachrichten oder Besprechungsinhalte",
      "Passwörter, Zugangsdaten oder Sicherheitstoken Ihrer Nutzer",
      "Jeglicher Schreibzugriff: LicenseMeter kann in Ihrem Tenant nichts verändern",
    ],
    note: "Nutzungsberichte werden nur als Zählwerte und Datum der letzten Aktivität verarbeitet: Metadaten, niemals Inhalte.",
  },
  stored: {
    title: "Was gespeichert wird",
    items: [
      "Lizenz-SKUs mit gekauften und zugewiesenen Platzanzahlen",
      "Verzeichnisnutzer: Anzeigename, UPN, Kontostatus, Nutzertyp, Erstellungsdatum, zugewiesene Lizenzen",
      "Zeitstempel der letzten Anmeldung (wenn Ihr Tenant Entra ID P1 hat) und Datum der letzten Aktivität je Dienst",
      "Die von Ihnen im Preisbuch gepflegten Preise und die daraus abgeleiteten Ergebnisse",
      "Wenn Sie Adobe, Zoom, Atlassian, Salesforce, OpenAI oder Anthropic verbinden (alle optional): E-Mails der Lizenzplätze bzw. Konsolenmitglieder, Status, Produktzuweisungen und, soweit der Anbieter sie bereitstellt, Datum der letzten Anmeldung, dazu tägliche API-Kostensummen für OpenAI und Anthropic; die Zugangsdaten selbst werden verschlüsselt gespeichert (AES-256-GCM) und nur lesend verwendet",
      "Wenn Sie ChatGPT- oder Claude-Mitgliederlisten importieren (optionales CSV-Einfügen): die in den eingefügten Daten enthaltenen E-Mails, Namen, Platztypen und Daten der letzten Aktivität",
      "Ein Aktivitätsprotokoll je Workspace über Exporte und administrative Aktionen, das mit dem Workspace gelöscht wird",
    ],
    note: "Der Zugang zu einem Workspace erfolgt auf Einladung. Die Anmeldung mit einem Konto aus Ihrem Tenant gewährt für sich genommen nichts; der Administrator, der die Einwilligung erteilt hat, entscheidet, wer die Daten in welcher Rolle sieht.",
  },
  residency: {
    title: "Datenhaltung, Aufbewahrung und Löschung",
    body: "Kundendaten der Anwendung werden in der EU gespeichert, in einer Supabase-Postgres-Datenbank auf AWS eu-central-1 (Frankfurt), entsprechend der aktuellen Formulierung der Datenschutzerklärung. Daten werden nur gespeichert, solange Ihr Tenant verbunden ist. Das Trennen des Workspace (Einstellungen → Gefahrenzone) löscht alle synchronisierten Daten sofort und unwiderruflich: Benutzer, Ergebnisse, Preise, Verlauf. Das Widerrufen der Unternehmensanwendung in Ihrem Entra ID unterbindet unseren Zugriff zusätzlich an der Quelle.",
  },
  subprocessors: {
    title: "Unterauftragsverarbeiter",
    note: {
      pre: "Die maßgebliche Liste der Unterauftragsverarbeiter ist Teil des ",
      linkText: "AVV",
      href: "/de/dpa#annex-3",
      post: ".",
    },
  },
  dpa: {
    title: "AVV / Auftragsverarbeitung",
    body: {
      pre: "LicenseMeter verarbeitet Verzeichnisdaten in Ihrem Auftrag, daher ist ein Auftragsverarbeitungsvertrag nach Art. 28 DSGVO (AVV) Bestandteil jedes Arbeitsbereichs. Der vollständige Text ist auf unserer Seite ",
      linkText: "Auftragsverarbeitungsvertrag",
      href: "/de/dpa",
      post: " veröffentlicht; dort laden Sie das vorunterzeichnete PDF auf Deutsch oder Englisch herunter, ergänzen Ihre Angaben und gegenzeichnen es. Kein E-Mail-Verkehr, kein Warten.",
    },
  },
  publisher: {
    title: "Herausgeberverifizierung",
    body: "Die Microsoft-Herausgeberverifizierung für die App-Registrierungen von LicenseMeter ist in Arbeit. Bis sie abgeschlossen ist, zeigt der Einwilligungsdialog die Apps als nicht verifiziert an, und Tenants mit strengen Einwilligungsrichtlinien blockieren sie möglicherweise. Microsoft zeigt den Verifizierungsstatus direkt im Einwilligungsdialog an, sodass Ihr Administrator den aktuellen Stand jederzeit unabhängig von dieser Seite überprüfen kann.",
  },
  who: {
    title: "Wer LicenseMeter entwickelt",
    pre: "LicenseMeter wird entwickelt und betrieben von ",
    kocLabel: "Ugur Koc",
    mid: ", Microsoft MVP für Intune und Security Copilot. Betreibergesellschaft ist die UgurLabs UG (haftungsbeschränkt) in Düsseldorf - dieselbe juristische Person, die im ",
    impressumLabel: "Impressum",
    post: " und in jedem AVV genannt ist. Die auf dieser Seite dokumentierten Nur-Lese-Designprinzipien gelten für das gesamte Produkt.",
  },
  questions: {
    title: "Fragen",
    body: "Sicherheitsprüfung, Pentest-Koordination oder Lieferantenfragebögen: ",
    seeAlso: {
      pre: ". Siehe auch ",
      faqLabel: "FAQ",
      mid: " und ",
      privacyLabel: "Datenschutzerklärung",
      post: ".",
    },
  },
};

/**
 * Only the German edition is static content here. The English URL builds its
 * content from next-intl translations instead (see
 * buildSecurityContentFromTranslations), because that is what lets /security
 * render in Norwegian for Norwegian-locale visitors.
 */
export const SECURITY_CONTENT: Record<Extract<DpaLang, "de">, SecurityContent> =
  {
    de: DE,
  };
