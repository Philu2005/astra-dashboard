import type { DocArticle } from '../types';

export const apiReference: DocArticle = {
  slug: 'api-reference',
  title: 'API-Referenz',
  description: 'Vollständige Dokumentation aller HTTP-Endpunkte.',
  category: 'Technik & API',
  categorySlug: 'technik',
  readingTime: 8,
  popular: true,
  sections: [
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
| \`/support/tickets\` | GET | Session | Eigene Tickets auflisten |
| \`/support/tickets\` | POST | Session | Neues Ticket erstellen |
| \`/support/tickets/{id}\` | GET | Session | Ticketdetails abrufen |
| \`/support/tickets/{id}/reply\` | POST | Session | Auf Ticket antworten |
| \`/support/tickets/{id}/reopen\` | POST | Session | Gelöstes Ticket wieder öffnen |
| \`/support/admin/counters\` | GET | Admin | Ticketzähler abrufen |
| \`/support/admin/tickets\` | GET | Admin | Alle Tickets auflisten (mit Filtern) |
| \`/support/admin/tickets/{id}/status\` | POST | Admin | Ticketstatus ändern |
| \`/support/admin/tickets/{id}/priority\` | POST | Admin | Ticketpriorität ändern |
| \`/support/admin/tickets/{id}\` | DELETE | Admin | Ticket löschen |
| \`/support/admin/tickets/{id}/user-info\` | GET | Admin | Benutzerprofil zum Ticket |
| \`/support/admin/tickets/{id}/user-history\` | GET | Admin | Tickethistorie des Benutzers |`,
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
  "success": true,
  "count": 2,
  "servers": [
    {
      "id": "111222333444555",
      "name": "Mein Server",
      "icon": "abc123def456",
      "memberCount": 150,
      "owner": true,
      "permissions": {
        "administrator": true,
        "manage_guild": true
      }
    }
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
  "success": true,
  "server": {
    "id": "111222333444555",
    "name": "Mein Server",
    "icon": "abc123def456",
    "memberCount": 150,
    "channelCount": 25,
    "roleCount": 10,
    "ownerId": "999888777666555",
    "permissions": {
      "administrator": true,
      "manage_guild": true
    }
  }
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
  "success": true,
  "roles": [
    {
      "id": "111222333444555",
      "name": "Moderator",
      "color": 3447003,
      "position": 5,
      "permissions": "2147483647",
      "managed": false,
      "mentionable": true
    }
  ]
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
      content: `Gibt den Bot-Status zurück. **Keine Authentifizierung erforderlich.**

**Response (200):**
\`\`\`json
{
  "online": true,
  "status": "online",
  "last_heartbeat": "2026-11-14T15:30:00Z",
  "stale_after_seconds": 120
}
\`\`\`

Mögliche Status-Werte: \`online\`, \`offline\`, \`connecting\`, \`unknown\``,
    },
    {
      id: 'health',
      title: 'GET /health',
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
      content: `**GET /support/tickets** – Eigene Tickets auflisten

Query-Parameter: \`offset\` (int), \`limit\` (int, Standard: 50)

**POST /support/tickets** – Neues Ticket erstellen

Request-Body:
\`\`\`json
{
  "subject": "Betreff",
  "category": "Fehler melden",
  "description": "Beschreibung des Anliegens"
}
\`\`\`

Erlaubte Kategorien: \`Fehler melden\`, \`Problem mit einem Befehl\`, \`Problem mit einer Funktion\`, \`Verbesserungsvorschlag\`, \`Allgemeine Frage\`, \`Sonstiges\`

**GET /support/tickets/{id}** – Ticketdetails inkl. Nachrichtenverlauf

Zugriff nur für den Ticket-Ersteller oder Administratoren.

**POST /support/tickets/{id}/reply** – Nachricht senden

Request-Body: \`{ "message": "Nachrichtentext" }\`

Fehler: \`400\` wenn Ticket gelöst ist.

**POST /support/tickets/{id}/reopen** – Gelöstes Ticket wieder öffnen

Nur der Ticket-Ersteller kann ein gelöstes Ticket wieder öffnen. Fehler: \`400\` wenn Ticket nicht gelöst ist, \`403\` wenn nicht der Ersteller.`,
    },
    {
      id: 'support-admin',
      title: 'Support-Endpunkte (Administration)',
      level: 2,
      content: `Alle Admin-Endpunkte erfordern Administrator-Berechtigung (\`403\` bei fehlendem Zugriff).

**GET /support/admin/counters** – Ticketzähler

Response: \`{ "open": 5, "in_progress": 2, "resolved": 10, "total": 17 }\`

**GET /support/admin/tickets** – Alle Tickets auflisten

| Parameter | Typ | Beschreibung |
|---|---|---|
| \`status\` | string | Filtern nach Status (\`open\`, \`in_progress\`, \`resolved\`) |
| \`category\` | string | Filtern nach Kategorie |
| \`priority\` | string | Filtern nach Priorität |
| \`search\` | string | Suche in Ticketnummer, Betreff, Benutzername |
| \`exclude_status\` | string | Status ausschließen (z. B. \`resolved\`) |
| \`offset\` | int | Pagination-Offset |
| \`limit\` | int | Maximale Anzahl (Standard: 50) |

**POST /support/admin/tickets/{id}/status** – Status ändern

Request-Body: \`{ "status": "in_progress" }\`

Erlaubte Werte: \`open\`, \`in_progress\`, \`resolved\`

**POST /support/admin/tickets/{id}/priority** – Priorität ändern

Request-Body: \`{ "priority": "high" }\`

Erlaubte Werte: \`low\`, \`normal\`, \`high\`, \`critical\`

**DELETE /support/admin/tickets/{id}** – Ticket dauerhaft löschen

**GET /support/admin/tickets/{id}/user-info** – Benutzerprofil und Ticketstatistiken

**GET /support/admin/tickets/{id}/user-history** – Alle anderen Tickets des Benutzers`,
    },
  ],
};
