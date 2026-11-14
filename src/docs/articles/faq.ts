import type { DocArticle } from '../types';

export const faq: DocArticle = {
  slug: 'faq',
  title: 'Häufig gestellte Fragen',
  description: 'Antworten auf die häufigsten Fragen zum Astra Dashboard.',
  category: 'Hilfe & Fehlerbehebung',
  categorySlug: 'hilfe',
  readingTime: 3,
  sections: [
    {
      id: 'allgemein',
      title: 'Allgemeine Fragen',
      level: 2,
      content: `**Was ist das Astra Dashboard?**
Das Astra Dashboard ist ein Web-Dashboard zur Verwaltung und Überwachung des Discord-Bots Astra. Es zeigt Statistiken, Serverlisten und den Bot-Status.

**Brauche ich einen eigenen Account?**
Nein. Du meldest dich mit deinem bestehenden Discord-Account an. Es wird kein separates Konto benötigt.

**Welche Daten werden von Discord geladen?**
Nur dein Benutzername, Anzeigename und Avatar (Scope: \`identify\`). Keine Nachrichten, keine E-Mail, keine Serverlisten direkt von Discord.

**Ist das Dashboard kostenlos?**
Ja, das Dashboard ist kostenlos nutzbar.`,
    },
    {
      id: 'server',
      title: 'Server und Funktionen',
      level: 2,
      content: `**Warum sehe ich meinen Server nicht?**
Das Dashboard zeigt nur Server, auf denen Astra installiert ist und du Mitglied bist. Installiere Astra über den „Astra einladen"-Button.

**Kann ich Servereinstellungen über das Dashboard ändern?**
Aktuell zeigt das Dashboard Serverinformationen an. Konfigurationsmöglichkeiten wie Modlog und Automod sind als zukünftige Funktionen geplant.

**Was bedeuten die Berechtigungen „administrator" und „manage_guild"?**
Diese spiegeln deine Discord-Berechtigungen auf dem jeweiligen Server wider. Sie werden von der Astra Bot API ermittelt.`,
    },
    {
      id: 'sicherheit',
      title: 'Sicherheit und Datenschutz',
      level: 2,
      content: `**Wie sicher ist meine Anmeldung?**
Die Anmeldung verwendet Discord OAuth2 mit kryptografischem State-Parameter, HttpOnly-Cookies und SHA-256-Token-Hashing. Dein Discord-Passwort wird nie an das Dashboard übermittelt.

**Wie lange bin ich angemeldet?**
Standardmäßig 30 Tage. Die Session läuft bei Inaktivität oder nach Ablauf der maximalen Lebensdauer ab.

**Kann ich meine Cookie-Einstellungen ändern?**
Ja, jederzeit über den „Cookie-Einstellungen"-Link auf der Homepage oder im Dashboard.

**Werden meine Daten an Dritte weitergegeben?**
Nein. Daten werden nur zwischen dem Dashboard-Frontend, dem Backend und der internen Astra Bot API ausgetauscht.`,
    },
    {
      id: 'support',
      title: 'Support und Tickets',
      level: 2,
      content: `**Wie erstelle ich ein Support-Ticket?**
Navigiere über die Sidebar zum Menüpunkt „Support". Das Erstellungsformular wird automatisch angezeigt. Fülle Betreff, Kategorie und Beschreibung aus und sende das Formular ab.

**Kann ich ein gelöstes Ticket wieder öffnen?**
Ja. Öffne das gelöste Ticket und klicke auf „Ticket wieder öffnen". Der Status wird auf „Offen" zurückgesetzt und der gesamte Nachrichtenverlauf bleibt erhalten.

**Wer kann meine Tickets sehen?**
Nur du selbst und das Astra-Support-Team (Administratoren) können deine Tickets und Nachrichten einsehen.

**Was ist der Unterschied zwischen dem Website-Support und dem Discord-Ticketsystem?**
Das Website-Supportsystem im Dashboard ist vollständig unabhängig vom Discord-Ticketsystem des Bots. Beide Systeme arbeiten getrennt voneinander.`,
    },
    {
      id: 'technisch',
      title: 'Technische Fragen',
      level: 2,
      content: `**Welche Browser werden unterstützt?**
Alle modernen Browser: Chrome, Firefox, Safari, Edge. Internet Explorer wird nicht unterstützt.

**Gibt es eine API-Dokumentation?**
Ja, siehe den Artikel „API-Referenz" in dieser Dokumentation. Zusätzlich ist eine Swagger UI unter \`/docs\` auf dem Backend verfügbar.

**Wie kann ich das Dashboard lokal entwickeln?**
Siehe die Installationsanleitung in der Projektdokumentation. Kurzfassung: \`npm install\`, \`backend/.env\` konfigurieren, \`npm run dev\` startet Frontend und Backend parallel.`,
    },
  ],
};
