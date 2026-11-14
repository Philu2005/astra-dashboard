import type { DocArticle } from '../types';

export const gettingStarted: DocArticle = {
  slug: 'getting-started',
  title: 'Erste Schritte mit Astra Dashboard',
  description: 'Lerne, wie du das Astra Dashboard einrichtest und zum ersten Mal nutzt.',
  category: 'Erste Schritte',
  categorySlug: 'erste-schritte',
  readingTime: 3,
  popular: true,
  sections: [
    {
      id: 'was-ist-astra',
      title: 'Was ist das Astra Dashboard?',
      level: 2,
      content: `Das Astra Dashboard ist ein Web-Dashboard zur Verwaltung und Überwachung des Discord-Bots „Astra". Es bietet authentifizierten Nutzern Zugriff auf:

- **Dashboard-Startseite** mit globalen Statistiken (Nutzer, Server, Befehle) und Bot-Status
- **Serverübersicht** mit allen Discord-Servern, auf denen Astra installiert ist
- **Öffentliche Homepage** mit Feature-Vorstellung und Bot-Einladung`,
    },
    {
      id: 'voraussetzungen',
      title: 'Voraussetzungen',
      level: 2,
      content: `Um das Astra Dashboard nutzen zu können, benötigst du:

- Einen **Discord-Account**
- Einen Discord-Server, auf dem **Astra installiert** ist
- Einen modernen Webbrowser (Chrome, Firefox, Safari, Edge)`,
    },
    {
      id: 'anmeldung',
      title: 'Anmeldung',
      level: 2,
      content: `1. Öffne die Astra Dashboard-Website
2. Klicke auf **„Anmelden"** oder navigiere zu \`/login\`
3. Du wirst automatisch zu Discord weitergeleitet
4. Autorisiere Astra Dashboard mit dem Scope **identify**
5. Nach erfolgreicher Autorisierung wirst du zum Dashboard weitergeleitet

Die Anmeldung verwendet Discord OAuth2. Es werden nur dein Benutzername, Anzeigename und Avatar geladen – keine Nachrichten oder Serverdaten direkt von Discord.`,
    },
    {
      id: 'navigation',
      title: 'Navigation im Dashboard',
      level: 2,
      content: `Nach der Anmeldung siehst du das Dashboard mit folgenden Bereichen:

- **Sidebar (links):** Navigation zu Übersicht, Servern, Dokumentation und weiteren Bereichen
- **Topbar (oben):** Seitentitel, Bot-Status-Indikator und dein Profil mit Logout-Option
- **Hauptbereich:** Statistiken, Diagramme und Schnellzugriff-Karten

Auf mobilen Geräten ist die Sidebar über ein Hamburger-Menü erreichbar.`,
    },
    {
      id: 'astra-einladen',
      title: 'Astra auf deinen Server einladen',
      level: 2,
      content: `Falls Astra noch nicht auf deinem Server installiert ist:

1. Klicke auf **„Astra einladen"** in der Sidebar oder auf der Homepage
2. Du wirst zur Discord-Einladungsseite weitergeleitet
3. Wähle den gewünschten Server aus
4. Bestätige die Berechtigungen

Nach der Installation erscheint der Server in deiner Serverübersicht im Dashboard.`,
    },
  ],
};
