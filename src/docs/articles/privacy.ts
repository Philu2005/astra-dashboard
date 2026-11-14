import type { DocArticle } from '../types';

export const privacy: DocArticle = {
  slug: 'privacy',
  title: 'Datenschutz & Sicherheitsmaßnahmen',
  description: 'Welche Daten gespeichert werden und wie sie geschützt sind.',
  category: 'Sicherheit & Datenschutz',
  categorySlug: 'sicherheit',
  readingTime: 4,
  sections: [
    {
      id: 'gespeicherte-daten',
      title: 'Gespeicherte Daten',
      level: 2,
      content: `Das Astra Dashboard speichert folgende Daten:

**In der Datenbank (MySQL):**
- Session-Token-Hash (SHA-256, kein Klartext)
- Discord User-ID
- Benutzername und Anzeigename
- Avatar-URL
- Session-Zeitstempel (Erstellung, letzte Aktivität, Ablauf)

**Im Browser:**
- Session-Cookie (\`session_id\`, HttpOnly)
- Cookie-Consent-Entscheidung (\`localStorage\`)

**Nicht gespeichert:**
- Discord-Passwort
- E-Mail-Adresse
- Nachrichten oder Chatverläufe
- Discord Access Token (wird nur temporär im Backend verwendet)`,
    },
    {
      id: 'cors',
      title: 'CORS-Konfiguration',
      level: 2,
      content: `Cross-Origin Resource Sharing ist streng konfiguriert:

- **Origins:** Whitelist über \`CORS_ORIGINS\` (kommasepariert)
- **Methoden:** Nur GET, POST und OPTIONS
- **Headers:** Nur Content-Type und Accept
- **Credentials:** Aktiviert für Cookie-basierte Authentifizierung

Der Logout-Endpunkt prüft zusätzlich den Origin-Header gegen die CORS-Whitelist.`,
    },
    {
      id: 'secrets',
      title: 'Umgang mit Secrets',
      level: 2,
      content: `- Alle Zugangsdaten werden über **Umgebungsvariablen** (\`.env\`) konfiguriert
- \`.env.example\` dient als Vorlage ohne echte Werte
- **Keine Secrets im Quellcode**
- **Keine Secrets in Log-Ausgaben** – Session-IDs und Tokens werden nicht protokolliert
- **Keine internen Details in Fehlermeldungen** – API-Fehler geben nur generische Meldungen zurück
- **Startup-Validierung** verhindert den Start bei fehlender oder unsicherer Konfiguration`,
    },
    {
      id: 'interne-api',
      title: 'Interne API-Kommunikation',
      level: 2,
      content: `Die Kommunikation zwischen Dashboard-Backend und Astra Bot API:

- **Authentifizierung:** Bearer-Token über \`ASTRA_INTERNAL_API_KEY\`
- **Transport:** HTTP (intern, nicht öffentlich erreichbar)
- **Fehlerbehandlung:** Interne Auth-Fehler (401) werden als 502 an den Client weitergegeben

Das Frontend kommuniziert **nie direkt** mit der Bot-API.`,
    },
    {
      id: 'geplant',
      title: 'Geplante Sicherheitsmaßnahmen',
      level: 2,
      content: `Folgende Maßnahmen sind noch nicht implementiert:

**Hohe Priorität:**
- Rate Limiting für Login-, Exchange- und Callback-Endpunkte
- Expliziter CSRF-Token-Schutz für POST-Endpunkte

**Mittlere Priorität:**
- HTTPS-Erzwingung in Produktion

**Niedrige Priorität:**
- Autorisierung auf Basis von Discord-Berechtigungen
- Rollenbasierte Zugriffskontrolle (RBAC)`,
    },
  ],
};
