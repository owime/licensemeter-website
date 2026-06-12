# Verzeichnis von Verarbeitungstätigkeiten (Art. 30 Abs. 2 DSGVO) (ENTWURF)

> Internes Dokument des Auftragsverarbeiters. [Platzhalter] ausfüllen.

## Auftragsverarbeiter

[Vor- und Nachname], [Anschrift], Deutschland · support@your-domain.example
Kein Datenschutzbeauftragter bestellt [Schwellenwerte prüfen].

## Verarbeitung 1: LicenseMeter SaaS (im Auftrag der Kunden)

- Kategorien der Auftraggeber: Unternehmen mit Microsoft-365-Tenant (EU-Fokus)
- Verarbeitung: Lesende Synchronisation von Verzeichnis-, Lizenz- und
  Aktivitätsmetadaten (Microsoft Graph; optional Adobe UMAPI), Speicherung,
  Analyse, Anzeige, Export
- Kategorien betroffener Personen: Beschäftigte und Gastkonten der Kunden
- Datenkategorien: Name, UPN/E-Mail, Kontostatus, Lizenzzuweisungen,
  Aktivitätszeitstempel; optional Adobe-Produktzuweisungen. Keine Inhaltsdaten
- Empfänger: keine Weitergabe an Dritte; Subunternehmer siehe AVV Anlage 2
- Drittlandtransfer: Anbieter-Infrastruktur in EU (Frankfurt); Vercel Inc. und
  Supabase Inc. als US-Unternehmen mit EU-Verarbeitung und
  EU-Standardvertragsklauseln [DPF-Status prüfen]
- Löschfristen: unverzüglich bei Workspace-Trennung; Backups 7 Tage
- TOMs: siehe toms.md

## Verarbeitung 2: Eigene Verarbeitung als Verantwortlicher

- Workspace-Mitglieder (Name, E-Mail, Entra-IDs, Rollen): Vertragserfüllung,
  Löschung mit Workspace
- E-Mail-Interessenten der Landing-Page (E-Mail, Zeitpunkt): Zusendung
  angeforderter Unterlagen, Löschung auf Anfrage
- Aktivitätsprotokolle je Workspace: Nachvollziehbarkeit, Löschung mit
  Workspace
- Hosting-Logs (Vercel): Betriebssicherheit, Fristen des Anbieters
