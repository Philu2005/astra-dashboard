import type { DocArticle } from '../types';

export const botOverview: DocArticle = {
  slug: 'bot-overview',
  title: 'Astra Discord Bot – Überblick',
  description: 'Einführung, Architektur und Einrichtung des Astra Discord Bots. Stand: 16.11.2026',
  category: 'Astra Discord Bot',
  categorySlug: 'bot',
  readingTime: 6,
  sections: [
    {
      id: 'einleitung',
      title: 'Einführung',
      level: 2,
      content: `Astra ist ein modularer, deutschsprachiger Discord‑Bot. Das Dashboard ist **optional** – der Bot ist vollständig über Discord nutzbar. Diese Sektion beschreibt Funktionsbereiche (Cogs), Einrichtung und Zusammenspiel mit der Dashboard‑REST‑API.`,
    },
    {
      id: 'architektur',
      title: 'Technische Architektur',
      level: 2,
      content: `Komponenten:\n\n- **Astra (discord.py 2.x)** – Bot‑Prozess, lädt Cogs, verwaltet Aufgaben, kommuniziert mit Discord\n- **Interne HTTP‑API** (Flask/Waitress) – stellt Daten/Operationen für das Dashboard bereit (Service‑to‑Service)\n- **Dashboard Backend** (FastAPI) – authentifiziert Nutzer, ruft interne API auf, stellt \`/api/*\` bereit\n- **Dashboard Frontend** (React/Vite) – UI für Server, Support, Status\n\nInteraktive API‑Referenz des Dashboard‑Backends: \`/api/docs\`.`,
    },
    {
      id: 'intents',
      title: 'Discord‑Intents',
      level: 2,
      content: `Aktiv: \`guilds\`, \`members\`, \`voice_states\`, \`messages\`, \`message_content\`, \`reactions\`. Presence‑Intents sind **deaktiviert**.`,
    },
    {
      id: 'datenbank',
      title: 'Datenbank & Pooling',
      level: 2,
      content: `Astra nutzt MariaDB/MySQL via **aiomysql** mit gemeinsam genutztem Connection‑Pool. Persistenz für u. a. XP/Level, Economy, Moderation, Tickets, Backups, Statistiken, Erinnerungen.`,
    },
    {
      id: 'env',
      title: 'Umgebungsvariablen (Auszug)',
      level: 2,
      content: `\`DISCORD_TOKEN\`, \`DB_HOST\`, \`DB_USER\`, \`DB_PASS\`, \`DB_NAME\`, \`DBL_TOKEN\`, \`DBL_PASS\`, \`DBL_PORT\`, \`DBL_SECRET_NEW\`, \`ASTRA_STATUS_API_URL\`, \`ASTRA_INTERNAL_API_BASE_URL\`, \`ASTRA_STATUS_API_TOKEN\`, \`ASTRA_INTERNAL_API_KEY\`, \`ASTRA_STATUS_HEARTBEAT_INTERVAL\`, \`ASTRA_HEARTBEAT_INTERVAL_SECONDS\`, \`ASTRA_GUILD_SYNC_RETRIES\`, \`ASTRA_GUILD_SNAPSHOT_INTERVAL_SECONDS\` (nur Namen dokumentiert).`,
    },
    {
      id: 'weitere-themen',
      title: 'Weitere Themen',
      level: 2,
      content: `- **Interne API & Dashboard‑Anbindung**: Siehe REST‑API‑Überblick und \`/api/docs\`\n- **Sicherheit**: Service‑zu‑Service‑Auth (Bearer) zwischen Dashboard‑Backend und interner API; Dashboard nutzt Sessions/CSRF/XSS‑Schutz\n- **Monitoring/Health**: Öffentliche Statusendpunkte und Heartbeat`,
    },
  ],
};
