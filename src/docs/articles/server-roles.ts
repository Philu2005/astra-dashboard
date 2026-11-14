import type { DocArticle } from '../types';

export const serverRoles: DocArticle = {
  slug: 'server-roles',
  title: 'Serverrollen',
  description: 'Rollen eines Discord-Servers einsehen und verstehen.',
  category: 'Serververwaltung',
  categorySlug: 'serververwaltung',
  readingTime: 2,
  sections: [
    {
      id: 'ueberblick',
      title: 'Überblick',
      level: 2,
      content: `Für jeden Server können die Discord-Rollen abgerufen werden. Die API liefert folgende Informationen pro Rolle:

| Feld | Typ | Beschreibung |
|---|---|---|
| **id** | string | Discord-Rollen-ID |
| **name** | string | Rollenname |
| **color** | number | Farbe als Integer |
| **position** | number | Position in der Rollenhierarchie |
| **permissions** | string | Discord-Berechtigungsbitfeld |
| **managed** | boolean | Ob die Rolle von einer Integration verwaltet wird |
| **mentionable** | boolean | Ob die Rolle erwähnbar ist |`,
    },
    {
      id: 'api-endpunkt',
      title: 'API-Endpunkt',
      level: 2,
      content: `\`\`\`
GET /api/servers/{guild_id}/roles
\`\`\`

**Authentifizierung:** Session-Cookie erforderlich

Die Rollen werden von der Astra Bot API geladen und direkt durchgereicht.`,
    },
    {
      id: 'verwaltete-rollen',
      title: 'Verwaltete Rollen',
      level: 2,
      content: `Rollen mit \`managed: true\` werden von Discord-Integrationen (Bots, Boosts etc.) automatisch verwaltet. Diese Rollen können nicht manuell zugewiesen oder entfernt werden.

> **Hinweis:** Eine Rollenverwaltung über das Dashboard ist als zukünftige Funktion geplant, aber noch nicht implementiert. Aktuell können Rollen nur eingesehen werden.`,
    },
  ],
};
