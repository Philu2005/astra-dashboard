import type { DocArticle } from '../types';

export const frontendStack: DocArticle = {
  slug: 'frontend-stack',
  title: 'Frontend-Architektur',
  description: 'React-Komponenten, Routing, State-Management und Styling.',
  category: 'Technik & API',
  categorySlug: 'technik',
  readingTime: 5,
  sections: [
    {
      id: 'ueberblick',
      title: 'Überblick',
      level: 2,
      content: `Das Frontend ist eine Single-Page-Application (SPA) auf Basis von **React 19** und **TypeScript 7**, gebaut mit **Vite 8**. Es verwendet **Tailwind CSS 4** für das Styling und **shadcn/ui** als Komponentenbibliothek.`,
    },
    {
      id: 'routing',
      title: 'Routing',
      level: 2,
      content: `Das Routing erfolgt über \`window.location.pathname\` in \`App.tsx\` (kein React Router). Die Pfade werden manuell ausgewertet:

| Pfad | Komponente | Zugriff |
|---|---|---|
| \`/\` | LandingPage | Öffentlich |
| \`/login\` | StaticInfoPage | Öffentlich |
| \`/auth/callback\` | StaticInfoPage | Öffentlich |
| \`/dashboard\` | Dashboard | Authentifiziert |
| \`/servers\` | Servers | Authentifiziert |
| \`/docs\` | DocsPage | Öffentlich |
| \`/docs/*\` | DocsArticlePage | Öffentlich |`,
    },
    {
      id: 'contexts',
      title: 'React Contexts',
      level: 2,
      content: `Das Projekt verwendet drei React Contexts für globalen State:

- **AuthContext** – Authentifizierungsstatus (global). Prüft Session über \`GET /auth/me\`, bietet \`login()\`, \`logout()\`, \`checkSession()\`.
- **ServerContext** – Serverliste und -auswahl (nur auf geschützten Seiten). Lädt Server über \`GET /api/servers\`, wählt automatisch den ersten Server.
- **ConsentContext** – Cookie-Consent mit Versionierung und localStorage-Persistenz.

Es gibt kein externes State-Management (kein Redux, Zustand o.ä.).`,
    },
    {
      id: 'hooks',
      title: 'Custom Hooks',
      level: 2,
      content: `- **\`useBotStatus(intervalMs)\`** – Pollt Bot-Status alle 15 Sekunden. Gibt Status zurück: \`loading\`, \`online\`, \`offline\`, \`connecting\`, \`unknown\`, \`api_error\`.
- **\`useDashboardStats(intervalMs)\`** – Lädt Dashboard-Statistiken alle 60 Sekunden. Gibt \`{ data, loading, error }\` zurück.`,
    },
    {
      id: 'api-client',
      title: 'API-Client',
      level: 2,
      content: `Der zentrale HTTP-Client (\`src/lib/api-client.ts\`) ist ein Wrapper um \`fetch\`:

- Sendet immer \`credentials: 'include'\` für Cookie-basierte Auth
- \`get(endpoint)\` – GET-Request
- \`post(endpoint, data?)\` – POST-Request mit JSON-Body
- \`getLoginUrl()\` – Discord-Login-URL

Der typisierte Service-Layer (\`src/services/server-api.ts\`) bietet \`getServers()\`, \`getServer()\`, \`getServerRoles()\` und \`getAstraStatus()\` mit automatischer Fehlerbehandlung.`,
    },
    {
      id: 'styling',
      title: 'Styling',
      level: 2,
      content: `- **Tailwind CSS 4** als Utility-First-Framework
- **shadcn/ui** für Basis-Komponenten
- **Lucide React** für Icons
- **Pfad-Alias:** \`@\` → \`src/\`
- **\`cn()\`-Utility** für bedingte Klassen (clsx + tailwind-merge)
- **Design-Tokens** in \`index.css\` für Astra-Farben und Layout-Variablen`,
    },
  ],
};
