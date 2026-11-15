import type { DocArticle } from '../types';

export const deploymentInfra: DocArticle = {
  slug: 'deployment-infra',
  title: 'Deployment & Infrastruktur',
  description: 'Reverse Proxy, Routen und Sicherheitsaspekte. Stand: 16.11.2026',
  category: 'Technik & API',
  categorySlug: 'technik',
  readingTime: 4,
  sections: [
    {
      id: 'reverse-proxy',
      title: 'Reverse Proxy Routing',
      level: 2,
      content: `Empfohlene Apache‑Konfiguration (vereinfachter Auszug, ProxyPass 1:1):

\`\`\`apache
# API-Endpunkte → FastAPI
ProxyPass /api/ http://127.0.0.1:8000/api/
ProxyPassReverse /api/ http://127.0.0.1:8000/api/

# Auth-Endpunkte → FastAPI
ProxyPass /auth/ http://127.0.0.1:8000/auth/
ProxyPassReverse /auth/ http://127.0.0.1:8000/auth/
\`\`\`

Alle übrigen Pfade werden als SPA ausgeliefert. Wichtige Besonderheiten:

- **Swagger UI** wird lokal unter **/api/docs** ausgeliefert (keine externen CDNs, kein Inline‑JS)
- **OpenAPI** steht unter **/api/openapi.json** bereit
- **Health** ist unter **/health** und **/api/health** verfügbar`,
    },
    {
      id: 'sicherheit',
      title: 'Sicherheitsaspekte (kurz)',
      level: 2,
      content: `- **CORS**: Whitelist per \`CORS_ORIGINS\`; erlaubte Methoden: GET, POST, OPTIONS, DELETE; Credentials aktiviert
- **CSRF**: Same‑Origin‑Prüfung für Schreibendpunkte im Browser (Origin‑Header)
- **CSP**: Swagger‑Assets lokal; keine Inline‑Skripte erforderlich
- **Secrets**: ausschließlich via Umgebungsvariablen, keine Secrets im Code`,
    },
  ],
};
