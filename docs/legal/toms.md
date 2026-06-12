# Technische und organisatorische Maßnahmen (TOMs) (ENTWURF)

> Anlage 1 zum AVV. Stand: Juni 2026. Jede Angabe entspricht der tatsächlichen
> Implementierung; bei Änderungen aktualisieren.

## 1. Zutritts-/Zugangskontrolle

- Kein eigener Serverbetrieb; Hosting bei Vercel (SOC 2) und Supabase/AWS
  eu-central-1 (ISO 27001, SOC 2)
- Zugang zu Produktionssystemen ausschließlich über die Administrationskonten
  des Anbieters mit MFA

## 2. Zugriffskontrolle

- Anwendungszugriff: Einladungsbasierte Mitgliedschaften je Workspace mit
  Rollen (Owner/Admin/Viewer); Anmeldung ausschließlich über Microsoft Entra
  ID (OIDC, PKCE); Sitzungen als signierte, HttpOnly-, Secure-Cookies
  (__Host-Präfix)
- Mandantentrennung: jede Datenbankabfrage ist über die Workspace-Mitgliedschaft
  des angemeldeten Nutzers gescoped (tenant_id), durch unabhängiges
  Security-Audit verifiziert
- Datenbank: dedizierte Least-Privilege-Rolle (nur CRUD auf Anwendungstabellen
  über explizite RLS-Policies); Supabase Data API durch deny-all RLS
  deaktiviert; Cron-Endpunkte mit Bearer-Secret

## 3. Verschlüsselung

- Transport: TLS 1.2+ überall (HSTS gesetzt)
- Ruhende Daten: AES-256 (Supabase/AWS-Speicherverschlüsselung)
- Drittanbieter-Zugangsdaten (Adobe Client Secret): zusätzlich
  anwendungsseitig AES-256-GCM-verschlüsselt
- Geheimnisse: ausschließlich in Umgebungsvariablen der Hosting-Plattform,
  nie im Code oder Repository

## 4. Eingabekontrolle / Protokollierung

- Aktivitätsprotokoll je Workspace (Exporte, Preisänderungen,
  Mitgliederverwaltung, Synchronisationen), einsehbar für Admins,
  kaskadenweise gelöscht mit dem Workspace
- Synchronisationsläufe mit Schrittprotokoll; operative Alarme bei
  Fehlschlägen (Webhook)

## 5. Verfügbarkeitskontrolle

- Tägliche Datenbank-Backups (7 Tage Aufbewahrung, danach Rotation)
- Health-Endpunkt für Verfügbarkeitsüberwachung
- Verfügbarkeit der Plattformen gemäß SLAs von Vercel/Supabase

## 6. Trennungskontrolle

- Logische Mandantentrennung über tenant_id in sämtlichen Tabellen mit
  Fremdschlüssel-Kaskaden
- Demo-Daten strikt getrennt vom Kundenbestand (eigener Demo-Mandant)

## 7. Datenminimierung (Art. 25)

- Lesende Microsoft-Graph-Berechtigungen; technisch kein Zugriff auf Inhalte
  (Postfächer, Dateien, Chats)
- Nur Metadaten-Spalten werden gespeichert; Nutzungsberichte werden zu
  Datumswerten reduziert
- Löschung bei Trennung unverzüglich (kaskadiert), Backups rotieren in 7 Tagen
