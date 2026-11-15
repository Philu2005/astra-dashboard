import type { DocArticle } from '../types';

export const sessions: DocArticle = {
  slug: 'sessions',
  title: 'Sessions & Cookies',
  description: 'Wie Sessions verwaltet werden und welche Cookies verwendet werden. Stand: 16.11.2026',
  category: 'Sicherheit & Datenschutz',
  categorySlug: 'sicherheit',
  readingTime: 3,
  sections: [
    {
      id: 'session-cookie',
      title: 'Session-Cookie',
      level: 2,
      content: `Nach erfolgreicher Anmeldung wird ein Session-Cookie gesetzt:

| Eigenschaft | Wert |
|---|---|
| **Name** | \`session_id\` |
| **HttpOnly** | \`true\` – kein JavaScript-Zugriff |
| **SameSite** | \`Lax\` – CSRF-Schutz |
| **Secure** | Konfigurierbar (in Produktion aktiviert) |
| **Max-Age** | 30 Tage (Standard) |
| **Path** | \`/\` |`,
    },
    {
      id: 'lebensdauer',
      title: 'Session-Lebensdauer',
      level: 2,
      content: `Sessions haben zwei Ablaufmechanismen:

- **Maximale Lebensdauer** (\`SESSION_MAX_AGE\`): 30 Tage. Absolute Grenze, unabhängig von Aktivität.
- **Inaktivitäts-Timeout** (\`SESSION_INACTIVITY_TIMEOUT\`): 30 Tage. Session wird invalidiert, wenn seit der letzten Aktivität mehr Zeit vergangen ist.

Die letzte Aktivität (\`last_active\`) wird bei jedem erfolgreichen \`GET /auth/me\`-Aufruf aktualisiert.`,
    },
    {
      id: 'speicherung',
      title: 'Serverseitige Speicherung',
      level: 2,
      content: `Sessions werden in der MySQL-Tabelle \`dashboard_sessions\` gespeichert. Gespeicherte Daten:

- SHA-256-Hash des Session-Tokens (nicht der Klartext)
- Discord User-ID
- Benutzername und Anzeigename
- Avatar-URL
- Erstellungszeitpunkt
- Letzte Aktivität
- Ablaufzeitpunkt`,
    },
    {
      id: 'bereinigung',
      title: 'Automatische Bereinigung',
      level: 2,
      content: `Ein Hintergrund-Task bereinigt stündlich abgelaufene Einträge:

- Abgelaufene Sessions
- Abgelaufene OAuth2-States
- Abgelaufene Exchange-Tokens

Zusätzlich werden abgelaufene Sessions bei Zugriff erkannt und sofort gelöscht.`,
    },
    {
      id: 'consent',
      title: 'Cookie-Consent',
      level: 2,
      content: `Das Astra Dashboard unterscheidet zwischen:

- **Notwendige Cookies** – Session-Cookie (immer aktiv, technisch erforderlich)
- **Analyse-Cookies** – Optional, nur mit Zustimmung

Die Consent-Entscheidung wird in \`localStorage\` gespeichert (Key: \`astra_consent\`) und ist versioniert. Bei Änderung der Consent-Version wird erneut gefragt. Die Einstellungen können jederzeit über „Cookie-Einstellungen" geändert oder widerrufen werden.`,
    },
    {
      id: 'cors-csp-xss',
      title: 'CORS, CSP & XSS-Schutz (Überblick)',
      level: 2,
      content: `**CORS**: Whitelist über \`CORS_ORIGINS\`; Methoden: **GET, POST, OPTIONS, DELETE**; Credentials aktiviert.\n\n**CSP/Swagger**: Swagger‑UI wird lokal inkl. Assets bereitgestellt (**/api/docs**), kein Inline‑JS, keine externen CDNs.\n\n**XSS‑Schutz (Frontend)**: Es werden keine Nutzerdaten per \`dangerouslySetInnerHTML\` gerendert. Zusätzlich erzwingen CI‑Guards den Verzicht auf riskante DOM‑APIs (z. B. \`innerHTML\`, \`eval\`). Playwright‑Tests prüfen gängige XSS‑Payloads.`,
    },
  ],
};
