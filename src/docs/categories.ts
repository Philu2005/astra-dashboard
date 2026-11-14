import type { DocCategory } from './types';

export const categories: DocCategory[] = [
  {
    slug: 'erste-schritte',
    title: 'Erste Schritte',
    description: 'Einrichtung und erste Nutzung des Astra Dashboards.',
    icon: 'Rocket',
    articles: ['getting-started', 'discord-login', 'dashboard-overview'],
  },
  {
    slug: 'serververwaltung',
    title: 'Serververwaltung',
    description: 'Server auswählen, verwalten und konfigurieren.',
    icon: 'Server',
    articles: ['server-overview', 'server-details', 'server-roles'],
  },
  {
    slug: 'sicherheit',
    title: 'Sicherheit & Datenschutz',
    description: 'Authentifizierung, Sessions und Datenschutz.',
    icon: 'Shield',
    articles: ['authentication', 'sessions', 'privacy'],
  },
  {
    slug: 'technik',
    title: 'Technik & API',
    description: 'Architektur, API-Endpunkte und technische Details.',
    icon: 'Code',
    articles: ['architecture', 'api-reference', 'frontend-stack', 'backend-stack'],
  },
  {
    slug: 'support',
    title: 'Support',
    description: 'Support-Tickets erstellen, verwalten und bearbeiten.',
    icon: 'Headset',
    articles: ['support-overview', 'support-admin'],
  },
  {
    slug: 'hilfe',
    title: 'Hilfe & Fehlerbehebung',
    description: 'Häufige Probleme und deren Lösungen.',
    icon: 'LifeBuoy',
    articles: ['troubleshooting', 'faq'],
  },
];
