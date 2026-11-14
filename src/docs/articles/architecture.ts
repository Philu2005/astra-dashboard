import type { DocArticle } from '../types';

export const architecture: DocArticle = {
  slug: 'architecture',
  title: 'Systemarchitektur',
  description: 'Aufbau und Zusammenspiel der Komponenten des Astra Dashboards.',
  category: 'Technik & API',
  categorySlug: 'technik',
  readingTime: 4,
  popular: true,
  sections: [
    {
      id: 'ueberblick',
      title: 'Architektur-Überblick',
      level: 2,
      content: `Das Astra Dashboard besteht aus drei Hauptkomponenten:

\`\`\`
React-Frontend  →  FastAPI-Backend  →  Astra Bot API
(Vite, :5173)      (Python, :8000)     (intern, :5000)
                        ↓
                   MySQL-Datenbank
                   (Sessions, States)
\`\`\`

- **Frontend → Backend:** HTTP-Requests mit Session-Cookie (\`credentials: 'include'\`)
- **Backend → Bot API:** Interne HTTP-Requests mit Bearer-Token (API-Key)
- **Backend → MySQL:** Asynchroner Connection-Pool (aiomysql)`,
    },
    {
      id: 'tech-stack',
      title: 'Technologie-Stack',
      level: 2,
      content: `| Komponente | Technologie | Version |
|---|---|---|
| Frontend-Framework | React | 19.3 |
| Sprache (Frontend) | TypeScript | 7.0 |
| Build-Tool | Vite | 8.3 |
| CSS-Framework | Tailwind CSS | 4.3 |
| UI-Komponenten | shadcn/ui | – |
| Icons | Lucide React | 1.71 |
| Backend-Framework | FastAPI | aktuell |
| HTTP-Client (Backend) | httpx | aktuell |
| Datenbank-Treiber | aiomysql | aktuell |
| Datenbank | MySQL | 8.x |
| Validierung | Pydantic | aktuell |
| Visuelle Tests | Playwright | 1.65 |`,
    },
    {
      id: 'datenfluss',
      title: 'Datenfluss',
      level: 2,
      content: `**Öffentliche Seiten** (\`/\`, \`/docs\`, \`/support\`, \`/status\`, \`/invite\`) werden direkt vom Frontend gerendert.

**Geschützte Seiten** (\`/dashboard\`, \`/servers\`) prüfen über \`AuthContext\` den Anmeldestatus:
1. \`AuthContext\` ruft \`GET /auth/me\` auf
2. Bei gültiger Session werden Benutzerdaten geladen
3. \`ServerContext\` lädt Serverliste über \`GET /api/servers\`
4. \`useDashboardStats\` lädt Statistiken über \`GET /api/dashboard/stats\`
5. \`useBotStatus\` pollt Bot-Status über \`GET /api/status\` (alle 15s)

**Backend als Proxy:** Das Backend leitet Anfragen an die interne Astra Bot API weiter und fügt den API-Key hinzu. Das Frontend kommuniziert nie direkt mit der Bot-API.`,
    },
    {
      id: 'datenbank',
      title: 'Datenbankarchitektur',
      level: 2,
      content: `MySQL-Datenbank mit drei Tabellen:

**\`dashboard_sessions\`** – Aktive Benutzersessions
- Session-Token-Hash, User-ID, Benutzerdaten, Zeitstempel
- Indizes auf \`expires_at\` und \`user_id\`

**\`oauth_states\`** – OAuth2-State-Tokens (10 Min. gültig)
- State-Hash, Ablaufzeit

**\`oauth_exchange_tokens\`** – Einmalige Exchange-Tokens (60s gültig)
- Token-Hash, zugehöriger Session-Hash, Ablaufzeit

Der Connection-Pool verwendet 1–10 Verbindungen mit Autocommit und utf8mb4-Charset.`,
    },
    {
      id: 'verzeichnisstruktur',
      title: 'Verzeichnisstruktur',
      level: 2,
      content: `\`\`\`
astra-dashboard/
├── backend/                 # FastAPI-Backend (Python)
│   ├── app/
│   │   ├── auth/            # Authentifizierung (Router, Service, Sessions)
│   │   ├── servers/         # Server-API (Router)
│   │   ├── services/        # Astra Bot API-Client
│   │   ├── config.py        # Konfiguration
│   │   ├── database.py      # MySQL Connection-Pool
│   │   └── main.py          # FastAPI-App
│   └── tests/               # Backend-Tests
├── src/                     # React-Frontend
│   ├── components/          # UI-Komponenten
│   ├── contexts/            # React Contexts (Auth, Server, Consent)
│   ├── docs/                # Dokumentationsplattform
│   ├── hooks/               # Custom Hooks
│   ├── layouts/             # Layout-Komponenten (Sidebar, Topbar)
│   ├── lib/                 # Hilfsfunktionen
│   ├── pages/               # Seitenkomponenten
│   ├── services/            # API-Service-Layer
│   └── types/               # TypeScript-Typen
├── docs/                    # Design-Referenzen
└── tests/                   # Playwright-Tests
\`\`\``,
    },
  ],
};
