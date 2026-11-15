import type { DocArticle } from '../types';

export const restApiOverview: DocArticle = {
  slug: 'rest-api-overview',
  title: 'REST API – Überblick',
  description: 'Aufgabe, Architektur und Gruppen der Astra Internal REST API. Interaktive Referenz: /api/docs · Stand: 16.11.2026',
  category: 'Technik & API',
  categorySlug: 'technik',
  readingTime: 5,
  popular: true,
  sections: [
    {
      id: 'zweck',
      title: 'Zweck und Rolle',
      level: 2,
      content: "Die REST API verbindet das Astra Dashboard (Frontend) mit den Backend‑Funktionen und der internen Astra Bot API. \n\nSie stellt lesende und schreibende Endpunkte für Benutzer (mit Session) sowie administrative Funktionen bereit und kapselt die Kommunikation mit dem Discord‑Bot (über die interne API).",
    },
    {
      id: 'architektur',
      title: 'Architektur',
      level: 2,
      content: "Komponenten:\n\n- Frontend (React, Vite) → konsumiert `/api/*` und `/auth/*`\n- Backend (FastAPI) → Router: Auth (`/auth/*`), Servers (`/api/*`), Support (`/api/support/*`), Monitoring (`/api/status/*`), Health (`/health`, `/api/health`)\n- Interne Astra Bot API → wird serverseitig vom Backend aufgerufen (durchgereichte Antworten, keine starren Schemas)\n\nInteraktive Referenz: `/api/docs` (CSP‑konform, alle Assets lokal). OpenAPI: `/api/openapi.json`.",
    },
    {
      id: 'auth-berechtigungen',
      title: 'Authentifizierung und Berechtigungen',
      level: 2,
      content: "- Benutzer‑Session per Cookie `session_id` (Login via Discord OAuth2: `/auth/discord/login` → `/auth/discord/callback` → `/auth/exchange`)\n- Admin‑Prüfung für Support‑Admin‑Endpunkte (serverseitig)\n- Monitoring‑Heartbeat (`POST /api/status/heartbeat`) erfordert Header `X-API-Key`\n- CSRF‑Schutz: Same‑Origin‑Prüfung für browserbasierte, session‑authentifizierte Schreibendpunkte (z. B. Support, Logout, Exchange)",
    },
    {
      id: 'gruppen',
      title: 'API‑Gruppen',
      level: 2,
      content: "- Auth: `/auth/*` – Login Flow, Session, Logout\n- Servers: `/api/*` – Serverliste, Serverdetails, Rollen, Statistiken, Bot‑Status\n- Support: `/api/support/*` – Tickets für Benutzer und Admin‑Funktionen\n- Monitoring: `/api/status/*` – Öffentliche Statusdaten und interner Heartbeat\n- Health: `/health`, `/api/health` – Health‑Checks",
    },
    {
      id: 'hinweise',
      title: 'Hinweise zur Nutzung',
      level: 2,
      content: "- Für die exakten Schemas und Beispiele bitte die Swagger‑UI unter `/api/docs` verwenden.\n- Servers‑Antworten werden aus der internen API durchgereicht; Beispiele sind exemplarisch.\n- Schreibendpunkte im Browser erfordern gültige Session + Same‑Origin.",
    },
  ],
};
