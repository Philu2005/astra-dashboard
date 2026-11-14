# API-Routing-Architektur

## Zielarchitektur (Soll-Struktur)

### FastAPI-Routen (Backend, Uvicorn auf Port 8000)

| Pfad                                      | Router          | Beschreibung                  |
|-------------------------------------------|-----------------|-------------------------------|
| `/health`                                 | main.py         | Health-Check (lokal)          |
| `/api/health`                             | main.py         | Health-Check (via Proxy)      |
| `/auth/discord/login`                     | auth_router     | OAuth2 Login-Start            |
| `/auth/discord/callback`                  | auth_router     | OAuth2 Callback               |
| `/auth/me`                                | auth_router     | Session-Info                  |
| `/auth/logout`                            | auth_router     | Logout                        |
| `/api/servers`                            | servers_router  | Serverliste                   |
| `/api/servers/{guild_id}`                 | servers_router  | Serverdetails                 |
| `/api/servers/{guild_id}/roles`           | servers_router  | Serverrollen                  |
| `/api/dashboard/stats`                    | servers_router  | Dashboard-Statistiken         |
| `/api/status`                             | servers_router  | Astra-Bot-Status              |
| `/api/support/tickets`                    | support_router  | Tickets (GET/POST)            |
| `/api/support/tickets/{id}`               | support_router  | Ticket-Detail                 |
| `/api/support/tickets/{id}/reply`         | support_router  | Ticket-Antwort                |
| `/api/support/admin/counters`             | support_router  | Admin-Zähler                  |
| `/api/support/admin/tickets`              | support_router  | Admin-Ticketliste             |
| `/api/support/admin/tickets/{id}/status`  | support_router  | Admin-Statusänderung          |

### Frontend API-Client

Der `apiClient` in `src/lib/api-client.ts` verwendet `API_BASE_URL = '/api'` als Basis.

**Regel:** Endpoints, die an `apiClient.get()` / `apiClient.post()` übergeben werden, dürfen **nicht** mit `/api/` beginnen, da der Prefix bereits in der Basis-URL enthalten ist.

Beispiele:
- ✅ `apiClient.get('/servers')` → `/api/servers`
- ✅ `apiClient.get('/support/tickets')` → `/api/support/tickets`
- ✅ `apiClient.get('/auth/me')` → `/auth/me` (Auth-Endpunkte nutzen separate Basis)
- ❌ `apiClient.get('/api/servers')` → `/api/api/servers` (doppeltes Prefix!)

Ein Dev-Guard (`assertNoDoubleApiPrefix`) warnt in der Entwicklungsumgebung bei Verstößen.

### Apache Reverse-Proxy (VPS-Konfiguration)

Die folgenden ProxyPass-Regeln müssen auf dem VPS konfiguriert sein:

```apache
# API-Endpunkte → FastAPI (Pfad wird 1:1 weitergeleitet)
ProxyPass /api/ http://127.0.0.1:8000/api/
ProxyPassReverse /api/ http://127.0.0.1:8000/api/

# Auth-Endpunkte → FastAPI
ProxyPass /auth/ http://127.0.0.1:8000/auth/
ProxyPassReverse /auth/ http://127.0.0.1:8000/auth/

# Alle anderen Pfade → Frontend (SPA)
# (z.B. über DocumentRoot oder separaten ProxyPass auf den Vite-Build)
```

**Wichtig:** Apache leitet `/api/*` und `/auth/*` **ohne Pfad-Umschreibung** an FastAPI weiter. Die Pfade auf FastAPI-Seite müssen exakt den öffentlichen URLs entsprechen.
