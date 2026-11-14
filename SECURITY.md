# SECURITY.md - Sicherheitskonzept

## Implementierte Maßnahmen

### Authentifizierung & Session-Management
- **Discord OAuth2**: Sicherer Login-Prozess mit kryptografischem State-Parameter (Schutz vor CSRF).
- **HttpOnly Cookies**: Session-IDs werden ausschließlich in HttpOnly-Cookies gespeichert, wodurch sie für clientseitiges JavaScript (XSS) unzugänglich sind.
- **Serverseitige Sessions**: Alle sicherheitsrelevanten Daten verbleiben auf dem Server.
- **State-Validierung**: OAuth2-State wird serverseitig und zusätzlich in einem kurzlebigen Cookie validiert (Double-Submit).
- **Inaktivitäts-Timeout**: Sessions werden nach konfigurierbarer Inaktivitätszeit automatisch invalidiert (Standard: 1 Stunde).
- **Session-Ablaufzeit**: Absolute Session-Lebensdauer begrenzt (Standard: 7 Tage).
- **Session-Fixation-Schutz**: Neue Session-ID bei jedem Login, kryptografisch sichere IDs via `secrets.token_urlsafe(32)`.
- **Session-Invalidierung**: Logout löscht Session serverseitig und entfernt Cookie.
- **Exchange-Token**: Einmalig verwendbar, 60 Sekunden Ablaufzeit, verhindert Replay-Angriffe.

### Konfiguration & Secrets
- **Startup-Validierung**: Fehlende oder unsichere Konfiguration (SESSION_SECRET < 32 Zeichen) verhindert den Serverstart.
- **Keine Secrets im Code**: Alle Zugangsdaten über Umgebungsvariablen (.env), `.env.example` als Vorlage ohne echte Werte.
- **Kein unsicherer Default**: SESSION_SECRET hat keinen Fallback-Wert mehr.

### API-Sicherheit
- **CORS**: Streng konfigurierte Whitelist für Origins, eingeschränkte HTTP-Methoden (GET, POST, OPTIONS) und Headers (Content-Type, Accept).
- **Origin-Validierung**: Logout-Endpunkt prüft Origin gegen CORS-Whitelist.
- **Credentials-Handling**: Cookies werden nur an explizit erlaubte Origins gesendet.
- **Sichere Fehlerbehandlung**: Keine internen Details in API-Fehlermeldungen.

### Logging & Datenschutz
- **Keine Session-IDs in Logs**: Session-Identifikatoren werden nicht protokolliert.
- **Keine Secrets in Logs**: Zugangsdaten und Token werden nicht ausgegeben.
- **Sicherheitsrelevante Ereignisse**: Login, Logout, fehlgeschlagene Validierungen werden protokolliert.

### Frontend-Sicherheit
- **Dashboard-Schutz**: Zugriff auf `/dashboard` erfordert eine aktive Session.
- **Automatische Maskierung**: React schützt nativ gegen die meisten XSS-Angriffe.
- **Redirect-Loop-Schutz**: Login wird nur durch bewussten Benutzerpfad (`/login`) und kontrollierten Auth-Status gestartet.
- **Konfigurierbare Backend-URL**: Keine hardcodierten URLs im Frontend-Code.

### Datenschutz & Consent
- **Consent-Banner**: Transparente Auswahl zwischen „Alle akzeptieren", „Nur notwendige Cookies" und „Einstellungen".
- **Trennung der Systeme**: Session-Cookie (notwendig) ist technisch von optionalen Consent-Entscheidungen getrennt.
- **Widerruf**: Cookie-Einstellungen sind jederzeit über „Cookie-Einstellungen" erneut aufrufbar und änderbar.

## Offene Punkte / Geplante Maßnahmen

### Priorität Hoch
- **Rate Limiting**: Für Login-, Exchange- und Callback-Endpunkte (z.B. via slowapi).
- **CSRF-Token**: Expliziter CSRF-Schutz für POST-Endpunkte (aktuell nur Origin-Check beim Logout).
- **Persistente Sessions**: Migration von In-Memory auf Datenbank (Sessions gehen bei Neustart verloren).

### Priorität Mittel
- **HTTPS**: Erzwungene Verschlüsselung in Produktion (Secure-Attribut für Cookies).
- **Datenbank**: Migration auf MySQL/PostgreSQL mit SQLAlchemy.

### Priorität Niedrig
- **Autorisierung**: Prüfung von Server-Berechtigungen (Discord Permissions) für Dashboard-Funktionen.
- **RBAC**: Rollenbasierte Zugriffskontrolle.
