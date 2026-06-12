# Auftragsverarbeitungsvertrag (AVV) (ENTWURF)

> Entwurf gemäß Art. 28 Abs. 3 DSGVO. Vor Verwendung anwaltlich prüfen lassen
> und [Platzhalter] ausfüllen. Dieses Dokument wird Kunden auf Anfrage als PDF
> bereitgestellt ("DPA available on request" auf der Security-Seite).

## 1. Parteien

Verantwortlicher (Kunde): [Firma, Anschrift, wird je Vertrag ergänzt]

Auftragsverarbeiter (Anbieter): [Vor- und Nachname], [Anschrift], Deutschland,
nachfolgend "LicenseMeter".

## 2. Gegenstand und Dauer

Der Anbieter betreibt einen Dienst zur Analyse von Software-Lizenzkosten
(LicenseMeter). Gegenstand der Verarbeitung ist die Auswertung von
Verzeichnis-, Lizenz- und Aktivitätsmetadaten des Microsoft-365-Tenants des
Kunden sowie optional der Lizenzzuweisungen der Adobe Admin Console des
Kunden. Die Dauer entspricht der Laufzeit der Hauptvereinbarung; die
Verarbeitung endet mit dem Trennen des Workspace durch den Kunden.

## 3. Art und Zweck der Verarbeitung

Nächtliche, lesende Synchronisation über die vom Kunden per Admin Consent
autorisierten Microsoft-Graph-Berechtigungen (User.Read.All,
AuditLog.Read.All, Reports.Read.All, LicenseAssignment.Read.All,
ReportSettings.Read.All, sämtlich lesend) bzw. die Adobe User Management API;
Speicherung der Ergebnisse; Berechnung von Einsparpotenzialen; Anzeige für vom
Kunden eingeladene Nutzer; Exporte (CSV, PowerShell-Skripte).

## 4. Datenarten

- Verzeichnisdaten: Anzeigename, UPN/E-Mail, Kontostatus, Benutzertyp,
  Erstellungsdatum, Lizenzzuweisungen
- Aktivitätsmetadaten: Zeitstempel letzter Anmeldungen, Datum letzter
  Aktivität je Dienst (nur Datumswerte, keine Inhalte)
- Optional Adobe: E-Mail, Status, Produktzuweisungen
- KEINE Postfach-, Datei-, Chat- oder sonstigen Inhaltsdaten; der Zugriff ist
  technisch auf lesende Metadaten-Berechtigungen beschränkt

## 5. Kategorien betroffener Personen

Beschäftigte und Gastkonten im Microsoft-365-Tenant (bzw. Adobe-Konsole) des
Kunden.

## 6. Weisungen

Die Verarbeitung erfolgt ausschließlich auf dokumentierte Weisung des Kunden;
die Konfiguration im Produkt (Verbinden, Trennen, Einladungen, Exporte) gilt
als Weisung. Hält der Anbieter eine Weisung für rechtswidrig, informiert er
den Kunden unverzüglich.

## 7. Vertraulichkeit

Zugriffsberechtigte Personen des Anbieters sind zur Vertraulichkeit
verpflichtet. [Bei Solo-Betrieb: Zugriff hat ausschließlich der Anbieter
selbst.]

## 8. Technische und organisatorische Maßnahmen

Gemäß Anlage 1 (TOMs, siehe toms.md). Wesentlich: TLS-Transportverschlüsselung,
AES-256-Verschlüsselung ruhender Daten, EU-Datenhaltung (Frankfurt),
rollenbasierte Zugriffe mit Least-Privilege-Datenbankrolle, deny-all
Row-Level-Security auf API-Ebene, Aktivitätsprotokoll je Workspace,
unverzügliche Löschung bei Trennung.

## 9. Subunternehmer

Anlage 2: Vercel Inc. (Hosting, EU-Funktionsregion Frankfurt), Supabase Inc.
(PostgreSQL-Datenbank, AWS eu-central-1 Frankfurt), Microsoft (Identity
Platform und Graph API), [Resend Inc. (E-Mail-Versand), nur falls aktiviert].
Änderungen werden dem Kunden vorab mit Widerspruchsmöglichkeit (14 Tage)
mitgeteilt.

## 10. Betroffenenrechte und Unterstützung

Der Anbieter unterstützt den Kunden bei der Erfüllung von Betroffenenrechten
(Art. 12 bis 23 DSGVO). Anfragen Betroffener leitet der Anbieter unverzüglich an
den Kunden weiter.

## 11. Meldung von Verletzungen

Der Anbieter meldet Verletzungen des Schutzes personenbezogener Daten dem
Kunden unverzüglich, spätestens innerhalb von 72 Stunden nach Kenntnis, mit
den Angaben nach Art. 33 Abs. 3 DSGVO.

## 12. Löschung und Rückgabe

Mit Trennen des Workspace werden alle synchronisierten Daten unverzüglich und
unwiderruflich gelöscht (kaskadierende Löschung). Datenbank-Backups rotieren
innerhalb von 7 Tagen aus. Auf Wunsch stellt der Anbieter zuvor einen Export
(CSV) bereit.

## 13. Nachweise und Kontrollen

Der Anbieter stellt zum Nachweis die TOMs-Dokumentation, die öffentliche
Security-Übersicht und auf Anfrage weitere Auskünfte bereit. Vor-Ort-Kontrollen
nach angemessener Ankündigung während üblicher Geschäftszeiten.

---

Anlage 1: TOMs (toms.md) · Anlage 2: Subunternehmerliste (Ziffer 9)
