import type { DocArticle } from '../types';

export const backendStack: DocArticle = {
  slug: 'backend-stack',
  title: 'Backend-Architektur',
  description: 'FastAPI, Datenbank, Services und Konfiguration.',
  category: 'Technik & API',
  categorySlug: 'technik',
  readingTime: 5,
  sections: [
    {
      id: 'ueberblick',
      title: 'Überblick',
      level: 2,
      content: `Das Backend ist eine asynchrone **FastAPI**-Anwendung (Python), die als Vermittler zwischen dem React-Frontend und der internen Astra Bot API dient. Es verwaltet Authentifizierung, Sessions und leitet API-Anfragen weiter.

**Abhängigkeiten:** fastapi, uvicorn, httpx, python-dotenv, aiomysql, pydantic`,
    },
    {
      id: 'startup',
      title: 'Startup und Shutdown',
      level: 2,
      content: `**Startup-Ablauf:**
1. \`settings.validate()\` – Prüft kritische Konfiguration
2. \`init_pool()\` – Erstellt MySQL Connection-Pool
3. \`init_tables()\` – Erstellt Tabellen idempotent (IF NOT EXISTS)
4. \`_cleanup_loop()\` – Startet stündliche Bereinigung

**Shutdown-Ablauf:**
1. Cleanup-Task wird abgebrochen
2. MySQL Connection-Pool wird geschlossen`,
    },
    {
      id: 'router',
      title: 'Router-Struktur',
      level: 2,
      content: `- **Auth-Router** (Prefix \`/auth\`) – Login, Callback, Exchange, Me, Logout
- **Server-Router** (Prefix \`/api\`) – Servers, Server-Details, Roles, Stats, Status
- **Direkte Endpunkte** – \`/health\`, \`/docs\` (Swagger UI)`,
    },
    {
      id: 'astra-client',
      title: 'Astra Bot API-Client',
      level: 2,
      content: `Die Klasse \`AstraClient\` (\`app/services/astra_client.py\`) kommuniziert mit der internen Bot-API:

- **Basis-URL:** \`ASTRA_INTERNAL_API_URL\` (Standard: \`http://127.0.0.1:5000\`)
- **Authentifizierung:** Bearer-Token über \`ASTRA_INTERNAL_API_KEY\`
- **Timeout:** 10s (5s Connect)
- **Fehlerbehandlung:** \`AstraApiError\` mit Status-Mapping

Methoden: \`get_status()\`, \`get_servers()\`, \`get_server()\`, \`get_server_roles()\`, \`get_dashboard_stats()\``,
    },
    {
      id: 'konfiguration',
      title: 'Konfiguration',
      level: 2,
      content: `Alle Einstellungen über Umgebungsvariablen (\`backend/.env\`):

| Variable | Beschreibung | Pflicht |
|---|---|---|
| \`DISCORD_CLIENT_ID\` | OAuth2 Client-ID | ✅ |
| \`DISCORD_CLIENT_SECRET\` | OAuth2 Client-Secret | ✅ |
| \`DISCORD_REDIRECT_URI\` | OAuth2 Redirect-URI | – |
| \`FRONTEND_URL\` | Frontend-URL für Redirects | – |
| \`SESSION_SECRET\` | Min. 32 Zeichen | ✅ |
| \`SESSION_COOKIE_SECURE\` | Secure-Flag für Cookies | – |
| \`SESSION_MAX_AGE\` | Max. Session-Lebensdauer | – |
| \`SESSION_INACTIVITY_TIMEOUT\` | Inaktivitäts-Timeout | – |
| \`CORS_ORIGINS\` | Erlaubte Origins | – |
| \`ASTRA_INTERNAL_API_URL\` | Bot-API-URL | – |
| \`ASTRA_INTERNAL_API_KEY\` | Bot-API-Key | – |
| \`DB_HOST\` / \`DB_PORT\` / \`DB_NAME\` | MySQL-Verbindung | – |
| \`DB_USER\` / \`DB_PASSWORD\` | MySQL-Zugangsdaten | ✅ |`,
    },
    {
      id: 'middleware',
      title: 'Middleware',
      level: 2,
      content: `- **CORSMiddleware** – Origins aus \`CORS_ORIGINS\`, Methoden: GET/POST/OPTIONS, Headers: Content-Type/Accept, Credentials: true
- **Origin-Prüfung** – Logout-Endpunkt prüft Origin gegen CORS-Whitelist
- **Swagger UI** – Unter \`/docs\` mit angepasster OpenAPI-URL`,
    },
  ],
};
