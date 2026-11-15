import type { DocArticle } from '../types';

export const apiReference: DocArticle = {
  slug: 'api-reference',
  title: 'API-Referenz',
  description: 'Vollständige Dokumentation aller HTTP-Endpunkte. Interaktive Referenz: /api/docs · Stand: 16.11.2026',
  category: 'Technik & API',
  categorySlug: 'technik',
  readingTime: 8,
  popular: true,
  sections: [
    {
      id: 'swagger',
      title: 'Interaktive Swagger-Dokumentation',
      level: 2,
      content: `Die vollständige, interaktive API-Referenz steht lokal unter \`/api/docs\` bereit (CSP‑kompatibel, ohne externe CDNs).\n\nHinweis: Diese Text‑Referenz fasst die wichtigsten Endpunkte zusammen. Verbindlich ist die OpenAPI‑Spezifikation unter \`/api/openapi.json\`.`,
    },
    {
      id: 'ueberblick',
      title: 'Endpunkt-Übersicht',
      level: 2,
      content: `| Endpunkt | Methode | Auth | Beschreibung |
|---|---|---|---|
| \`/auth/discord/login\` | GET | – | OAuth2-Login starten |
| \`/auth/discord/callback\` | GET | – | OAuth2-Callback |
| \`/auth/exchange\` | POST | – | Exchange-Token einlösen |
| \`/auth/me\` | GET | Session | Benutzerdaten abrufen |
| \`/auth/logout\` | POST | Session | Abmelden |
| \`/api/servers\` | GET | Session | Serverliste |
| \`/api/servers/{guild_id}\` | GET | Session | Serverdetails |
| \`/api/servers/{guild_id}/roles\` | GET | Session | Serverrollen |
| \`/api/dashboard/stats\` | GET | Session | Dashboard-Statistiken |
| \`/api/status\` | GET | – | Bot-Status |
| \`/health\` | GET | – | Health-Check |
| \`/api/health\` | GET | – | Health-Check (Proxy) |
| \`/api/support/tickets\` | GET | Session | Eigene Tickets auflisten |
| \`/api/support/tickets\` | POST | Session | Neues Ticket erstellen |
| \`/api/support/tickets/{id}\` | GET | Session | Ticketdetails abrufen |
| \`/api/support/tickets/{id}/reply\` | POST | Session | Auf Ticket antworten |
| \`/api/support/tickets/{id}/reopen\` | POST | Session | Gelöstes Ticket wieder öffnen |
| \`/api/support/admin/counters\` | GET | Admin | Ticketzähler abrufen |
| \`/api/support/admin/tickets\` | GET | Admin | Alle Tickets auflisten (mit Filtern) |
| \`/api/support/admin/tickets/{id}/status\` | POST | Admin | Ticketstatus ändern |
| \`/api/support/admin/tickets/{id}/priority\` | POST | Admin | Ticketpriorität ändern |
| \`/api/support/admin/tickets/{id}\` | DELETE | Admin | Ticket löschen |
| \`/api/support/admin/tickets/{id}/user-info\` | GET | Admin | Benutzerprofil zum Ticket |
| \`/api/support/admin/tickets/{id}/user-history\` | GET | Admin | Tickethistorie des Benutzers |`,
    },
    {
      id: 'auth-me',
      title: 'GET /auth/me',
      level: 2,
      content: `Gibt die Benutzerdaten der aktuellen Session zurück.

**Authentifizierung:** Session-Cookie (\`session_id\`)

**Response (200):**
\`\`\`json
{
  "authenticated": true,
  "user": {
    "id": "123456789",
    "username": "beispielnutzer",
    "display_name": "Beispiel Nutzer",
    "avatar_url": "https://cdn.discordapp.com/avatars/123456789/abc123.png"
  }
}
\`\`\`

**Fehler:** \`401\` – Kein Cookie oder Session abgelaufen`,
    },
    {
      id: 'auth-exchange',
      title: 'POST /auth/exchange',
      level: 2,
      content: `Tauscht ein einmaliges Exchange-Token gegen ein Session-Cookie.

**Request-Body:**
\`\`\`json
{
  "token": "exchange_token_string"
}
\`\`\`

**Response (200):** Benutzerdaten (wie \`/auth/me\`) + setzt \`session_id\`-Cookie

**Fehler:** \`400\` – Fehlendes Token | \`401\` – Token ungültig oder abgelaufen`,
    },
    {
      id: 'auth-logout',
      title: 'POST /auth/logout',
      level: 2,
      content: `Beendet die aktuelle Session und löscht das Cookie.

**Zusätzliche Prüfung:** Origin-Header gegen CORS-Whitelist

**Response (200):**
\`\`\`json
{
  "success": true
}
\`\`\`

**Fehler:** \`403\` – Origin nicht in Whitelist`,
    },
    {
      id: 'api-servers',
      title: 'GET /api/servers',
      level: 2,
      content: `Gibt die Serverliste des angemeldeten Nutzers zurück.

**Authentifizierung:** Session-Cookie

**Response (200):**
\`\`\`json
{
  "servers": [
    { "id": "111222333444555", "name": "Mein Server", "icon": "https://cdn.discordapp.com/icons/.../icon.png" }
  ]
}
\`\`\`

**Fehler:** \`401\` | \`403\` | \`502\` | \`503\` | \`504\``,
    },
    {
      id: 'api-server-detail',
      title: 'GET /api/servers/{guild_id}',
      level: 2,
      content: `Gibt Detailinformationen zu einem Server zurück.

**Pfad-Parameter:** \`guild_id\` (string) – Discord Guild-ID

**Response (200):**
\`\`\`json
{
  "id": "111222333444555",
  "name": "Mein Server",
  "owner_id": "999888777666555"
}
\`\`\`

**Fehler:** \`401\` | \`403\` | \`404\` | \`502\` | \`503\` | \`504\``,
    },
    {
      id: 'api-roles',
      title: 'GET /api/servers/{guild_id}/roles',
      level: 2,
      content: `Gibt die Rollen eines Servers zurück.

**Response (200):**
\`\`\`json
{
  "roles": [ { "id": "1", "name": "Admin" }, { "id": "2", "name": "Member" } ]
}
\`\`\``,
    },
    {
      id: 'api-stats',
      title: 'GET /api/dashboard/stats',
      level: 2,
      content: `Gibt globale Dashboard-Statistiken zurück.

**Authentifizierung:** Session-Cookie

**Response (200):**
\`\`\`json
{
  "stats": {
    "users": 12500,
    "guilds": 85,
    "commands": 45000
  },
  "last_successful_sync": "2026-11-14T15:30:00Z",
  "stale": false
}
\`\`\`

| Feld | Beschreibung |
|---|---|
| \`stats.users\` | Gesamtzahl der Nutzer |
| \`stats.guilds\` | Gesamtzahl der Server |
| \`stats.commands\` | Gesamtzahl ausgeführter Befehle |
| \`last_successful_sync\` | Letzter Sync-Zeitpunkt |
| \`stale\` | Ob die Daten veraltet sind |`,
    },
    {
      id: 'api-status',
      title: 'GET /api/status',
      level: 2,
      content: `Gibt den Bot-Status zurück. **Keine Authentifizierung erforderlich.** Die Struktur wird direkt von der internen API geliefert (Beispiel exemplarisch).

**Response (200) – Beispiel:**
\`\`\`json
{ "ok": true, "version": "1.2.3" }
\`\`\`
`,
    },
    {
      id: 'health',
      title: 'GET /health und GET /api/health',
      level: 2,
      content: `Health-Check für Monitoring. **Keine Authentifizierung erforderlich.**

**Response (200):**
\`\`\`json
{
  "status": "healthy"
}
\`\`\``,
    },
    {
      id: 'fehlerbehandlung',
      title: 'Fehlerbehandlung',
      level: 2,
      content: `Fehler der internen Bot-API werden wie folgt umgewandelt:

| Bot-API-Status | Dashboard-Status | Bedeutung |
|---|---|---|
| 401 | 502 | Interner Auth-Fehler (API-Key ungültig) |
| 403 | 403 | Keine Berechtigung |
| 404 | 404 | Server nicht gefunden |
| 503 | 503 | Bot nicht bereit |
| Timeout | 504 | Zeitüberschreitung |
| Connect-Error | 503 | Bot nicht erreichbar |

Interne Details werden nie an den Client weitergegeben.`,
    },
    {
      id: 'support-tickets',
      title: 'Support-Endpunkte (Benutzer)',
      level: 2,
      content: `**GET /api/support/tickets** – Eigene Tickets auflisten

Query-Parameter: \`offset\` (int), \`limit\` (int, Standard: 50)

**POST /api/support/tickets** – Neues Ticket erstellen

Request-Body:
\`\`\`json
{
  "subject": "Betreff",
  "category": "Fehler melden",
  "description": "Beschreibung des Anliegens"
}
\`\`\`

Erlaubte Kategorien: \`Fehler melden\`, \`Problem mit einem Befehl\`, \`Problem mit einer Funktion\`, \`Verbesserungsvorschlag\`, \`Allgemeine Frage\`, \`Sonstiges\`

**GET /api/support/tickets/{id}** – Ticketdetails inkl. Nachrichtenverlauf

Zugriff nur für den Ticket-Ersteller oder Administratoren.

**POST /api/support/tickets/{id}/reply** – Nachricht senden

Request-Body: \`{ "message": "Nachrichtentext" }\`

Fehler: \`400\` wenn Ticket gelöst ist.

**POST /api/support/tickets/{id}/reopen** – Gelöstes Ticket wieder öffnen

Nur der Ticket-Ersteller kann ein gelöstes Ticket wieder öffnen. Fehler: \`400\` wenn Ticket nicht gelöst ist, \`403\` wenn nicht der Ersteller.`,
    },
    {
      id: 'support-admin',
      title: 'Support-Endpunkte (Administration)',
      level: 2,
      content: `Alle Admin-Endpunkte erfordern Administrator-Berechtigung (\`403\` bei fehlendem Zugriff).

**GET /api/support/admin/counters** – Ticketzähler

Response: \`{ "open": 5, "in_progress": 2, "resolved": 10, "total": 17 }\`

**GET /api/support/admin/tickets** – Alle Tickets auflisten

| Parameter | Typ | Beschreibung |
|---|---|---|
| \`status\` | string | Filtern nach Status (\`open\`, \`in_progress\`, \`resolved\`) |
| \`category\` | string | Filtern nach Kategorie |
| \`priority\` | string | Filtern nach Priorität |
| \`search\` | string | Suche in Ticketnummer, Betreff, Benutzername |
| \`exclude_status\` | string | Status ausschließen (z. B. \`resolved\`) |
| \`offset\` | int | Pagination-Offset |
| \`limit\` | int | Maximale Anzahl (Standard: 50) |

**POST /api/support/admin/tickets/{id}/status** – Status ändern

Request-Body: \`{ "status": "in_progress" }\`

Erlaubte Werte: \`open\`, \`in_progress\`, \`resolved\`

**POST /api/support/admin/tickets/{id}/priority** – Priorität ändern

Request-Body: \`{ "priority": "high" }\`

Erlaubte Werte: \`low\`, \`normal\`, \`high\`, \`critical\`

**DELETE /api/support/admin/tickets/{id}** – Ticket dauerhaft löschen

**GET /api/support/admin/tickets/{id}/user-info** – Benutzerprofil und Ticketstatistiken

**GET /api/support/admin/tickets/{id}/user-history** – Alle anderen Tickets des Benutzers`,
    },
  ],
};
