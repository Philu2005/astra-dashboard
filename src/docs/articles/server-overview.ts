import type { DocArticle } from '../types';

export const serverOverview: DocArticle = {
  slug: 'server-overview',
  title: 'Serverübersicht',
  description: 'Alle deine Discord-Server mit Astra auf einen Blick.',
  category: 'Serververwaltung',
  categorySlug: 'serververwaltung',
  readingTime: 2,
  popular: true,
  sections: [
    {
      id: 'ueberblick',
      title: 'Überblick',
      level: 2,
      content: `Die Serverübersicht unter \`/servers\` zeigt alle Discord-Server, auf denen Astra installiert ist und du Mitglied bist.

Für jeden Server werden angezeigt:

- **Server-Icon** oder Initialen als Fallback
- **Servername**
- **Mitgliederzahl**
- **Besitzer-Status** (ob du der Server-Owner bist)`,
    },
    {
      id: 'serverauswahl',
      title: 'Server auswählen',
      level: 2,
      content: `Du kannst einen Server auf zwei Wegen auswählen:

1. **Serverübersicht** (\`/servers\`) – Klicke auf einen Server in der Liste
2. **Sidebar-Dropdown** – Nutze das Dropdown in der Sidebar, um schnell zwischen Servern zu wechseln

Das Dropdown bietet zusätzlich eine **Suchfunktion**, um bei vielen Servern schnell den richtigen zu finden.

Der ausgewählte Server wird automatisch beim ersten Laden gesetzt (erster Server in der Liste).`,
    },
    {
      id: 'server-icons',
      title: 'Server-Icons',
      level: 2,
      content: `Server-Icons werden direkt von Discord geladen:

- **Statische Icons:** PNG-Format über Discord CDN
- **Animierte Icons:** GIF-Format (erkennbar am \`a_\`-Prefix im Icon-Hash)
- **Fallback:** Farbige Initialen des Servernamens, wenn kein Icon vorhanden ist

Die Farben der Fallback-Icons rotieren durch eine vordefinierte Palette für visuelle Unterscheidbarkeit.`,
    },
    {
      id: 'datenquelle',
      title: 'Datenquelle',
      level: 2,
      content: `Die Serverliste wird über die interne Astra Bot API geladen. Das Dashboard zeigt nur Server, auf denen:

1. **Astra installiert** ist
2. **Du Mitglied** bist

Server ohne Astra-Installation erscheinen nicht in der Liste. Um Astra auf einem neuen Server zu installieren, nutze den „Astra einladen"-Button.`,
    },
  ],
};
