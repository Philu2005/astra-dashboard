import type { DocArticle } from '../types';

export const dashboardOverview: DocArticle = {
  slug: 'dashboard-overview',
  title: 'Dashboard-Übersicht',
  description: 'Alle Bereiche und Funktionen der Dashboard-Startseite.',
  category: 'Erste Schritte',
  categorySlug: 'erste-schritte',
  readingTime: 4,
  popular: true,
  sections: [
    {
      id: 'aufbau',
      title: 'Aufbau der Startseite',
      level: 2,
      content: `Die Dashboard-Startseite unter \`/dashboard\` zeigt dir eine Übersicht über den aktuellen Zustand von Astra. Sie besteht aus folgenden Bereichen:

- **Statistik-Karten** – Vier Karten mit Kennzahlen
- **Befehlsdiagramm** – Verlauf der Befehlsnutzung als Area-Chart
- **Schnellzugriff** – Karten für häufig genutzte Funktionen
- **Aktivitätslog** – Letzte Aktivitäten
- **Bot-Status** – Aktueller Online-Status von Astra`,
    },
    {
      id: 'statistiken',
      title: 'Statistik-Karten',
      level: 2,
      content: `Die vier Statistik-Karten zeigen globale Kennzahlen:

| Karte | Beschreibung |
|---|---|
| **Nutzer** | Gesamtzahl der Nutzer über alle Server |
| **Server** | Anzahl der Server, auf denen Astra installiert ist |
| **Befehle** | Gesamtzahl ausgeführter Befehle |
| **Bot-Status** | Aktueller Online-Status mit farbigem Indikator |

Die Statistiken werden automatisch alle **60 Sekunden** aktualisiert. Falls die Daten veraltet sind, wird dies angezeigt.`,
    },
    {
      id: 'bot-status',
      title: 'Bot-Status',
      level: 2,
      content: `Der Bot-Status wird alle **15 Sekunden** abgefragt und zeigt einen der folgenden Zustände:

| Status | Farbe | Bedeutung |
|---|---|---|
| **Online** | 🟢 Grün | Astra läuft normal |
| **Offline** | 🔴 Rot | Astra ist nicht erreichbar |
| **Verbindet…** | 🟡 Gelb | Astra stellt Verbindung her |
| **Unbekannt** | ⚪ Grau | Status konnte nicht ermittelt werden |
| **API nicht erreichbar** | 🔴 Rot | Backend-Verbindung fehlgeschlagen |

Der Status wird sowohl in der Topbar als auch in der Sidebar angezeigt.`,
    },
    {
      id: 'diagramm',
      title: 'Befehlsdiagramm',
      level: 2,
      content: `Das Befehlsdiagramm zeigt den Verlauf der Befehlsnutzung als SVG Area-Chart. Es bietet:

- Interaktive Datenpunkte mit Tooltip
- Tagesbeschriftung auf der X-Achse
- Exakte Werte beim Hovern
- Violetter Gradient als Füllung

Das Diagramm passt sich responsiv an verschiedene Bildschirmgrößen an.`,
    },
    {
      id: 'schnellzugriff',
      title: 'Schnellzugriff',
      level: 2,
      content: `Die Schnellzugriff-Karten bieten direkten Zugang zu häufig genutzten Funktionen. Jede Karte enthält ein Icon, einen Titel und eine kurze Beschreibung.`,
    },
    {
      id: 'sidebar',
      title: 'Sidebar-Navigation',
      level: 2,
      content: `Die Sidebar enthält folgende Navigationsbereiche:

**Server-Bereich:**
- Serverauswahl-Dropdown mit Suchfunktion
- Konfiguration *(geplant)*
- Module *(geplant)*
- Berechtigungen *(geplant)*
- Logs *(geplant)*
- Statistiken *(geplant)*

**Allgemein:**
- Meine Server – Serverübersicht
- Support – Support-Tickets erstellen und verwalten (für Benutzer)
- Dokumentation – Diese Dokumentation
- Tickets – Administrative Ticketverwaltung (nur für Administratoren)

**Footer:**
- Astra einladen – Bot-Einladungslink
- Versionsnummer und Bot-Status`,
    },
  ],
};
