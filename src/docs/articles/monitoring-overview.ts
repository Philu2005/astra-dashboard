import type { DocArticle } from '../types';

export const monitoringOverview: DocArticle = {
  slug: 'monitoring-overview',
  title: 'Monitoring & Health',
  description: 'Statusendpunkte, Incidents und Heartbeat (X-API-Key). Stand: 16.11.2026',
  category: 'Technik & API',
  categorySlug: 'technik',
  readingTime: 4,
  sections: [
    {
      id: 'status',
      title: 'Öffentliche Statusendpunkte',
      level: 2,
      content: `- **GET /api/status/** – Aggregierter Gesamtstatus für die Statusseite\n- **GET /api/status/services** – Status aller Dienste\n- **GET /api/status/incidents** – Störungshistorie\n\nAlle diese Endpunkte sind öffentlich erreichbar und geben ausschließlich nicht‑sensible Informationen zurück.`,
    },
    {
      id: 'heartbeat',
      title: 'Interner Heartbeat',
      level: 2,
      content: `**POST /api/status/heartbeat** – Empfängt Heartbeats vom Astra Bot.\n\n- **Header:** \`X-API-Key\` mit internem Schlüssel\n- **Erfolg:** \`{ "status": "ok" }\`\n- **Fehler:** \`401\` (ungültiger Schlüssel), \`503\` (nicht konfiguriert)`,
    },
    {
      id: 'health',
      title: 'Health-Checks',
      level: 2,
      content: `- **GET /health** – Lokaler Health‑Check\n- **GET /api/health** – Health‑Check über Reverse‑Proxy\n\nAntwort: \`{ "status": "healthy" }\``,
    },
  ],
};
