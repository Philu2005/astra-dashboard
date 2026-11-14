import type { DocArticle } from '../types';

export const serverDetails: DocArticle = {
  slug: 'server-details',
  title: 'Serverdetails',
  description: 'Detailinformationen zu einem einzelnen Discord-Server.',
  category: 'Serververwaltung',
  categorySlug: 'serververwaltung',
  readingTime: 2,
  sections: [
    {
      id: 'ueberblick',
      title: 'Überblick',
      level: 2,
      content: `Für jeden ausgewählten Server können Detailinformationen abgerufen werden. Die API liefert folgende Daten:

| Feld | Beschreibung |
|---|---|
| **Name** | Servername |
| **Icon** | Server-Icon (oder null) |
| **Mitglieder** | Anzahl der Mitglieder |
| **Kanäle** | Anzahl der Kanäle |
| **Rollen** | Anzahl der Rollen |
| **Besitzer-ID** | Discord-ID des Server-Besitzers |
| **Berechtigungen** | Administrator- und Manage-Guild-Status |`,
    },
    {
      id: 'berechtigungen',
      title: 'Berechtigungen',
      level: 2,
      content: `Für jeden Server werden deine Discord-Berechtigungen übermittelt:

- **administrator** – Ob du Administrator-Rechte hast
- **manage_guild** – Ob du den Server verwalten darfst

Diese Berechtigungen werden von der Astra Bot API basierend auf deinen Discord-Rollen ermittelt.

> **Hinweis:** Eine rollenbasierte Zugriffskontrolle (RBAC) im Dashboard ist als zukünftige Funktion geplant, aber noch nicht implementiert.`,
    },
    {
      id: 'api-endpunkt',
      title: 'API-Endpunkt',
      level: 2,
      content: `Die Serverdetails werden über folgenden Endpunkt geladen:

\`\`\`
GET /api/servers/{guild_id}
\`\`\`

**Authentifizierung:** Session-Cookie erforderlich

Der Endpunkt leitet die Anfrage an die interne Astra Bot API weiter und fügt automatisch die User-ID aus der Session hinzu.`,
    },
  ],
};
