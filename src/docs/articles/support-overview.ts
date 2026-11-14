import type { DocArticle } from '../types';

export const supportOverview: DocArticle = {
  slug: 'support-overview',
  title: 'Support & Tickets',
  description: 'Erstelle Support-Tickets und kommuniziere direkt mit dem Astra-Support-Team.',
  category: 'Support',
  categorySlug: 'support',
  readingTime: 5,
  popular: true,
  sections: [
    {
      id: 'ueberblick',
      title: 'Überblick',
      level: 2,
      content: `Das Astra Dashboard verfügt über ein integriertes Support-Ticketsystem. Darüber kannst du Fehler melden, Fragen stellen oder Verbesserungsvorschläge einreichen.

Deine Tickets werden direkt im Dashboard verwaltet – ohne externe Tools oder E-Mails.

**Wichtig:** Das Website-Supportsystem ist unabhängig vom Discord-Ticketsystem des Bots. Beide Systeme arbeiten getrennt voneinander.`,
    },
    {
      id: 'ticket-erstellen',
      title: 'Ticket erstellen',
      level: 2,
      content: `Navigiere über die Sidebar zum Menüpunkt **Support**. Im Detailbereich wird standardmäßig das Ticket-Erstellungsformular angezeigt.

**Pflichtfelder:**

| Feld | Beschreibung |
|---|---|
| **Betreff** | Kurze Zusammenfassung deines Anliegens |
| **Kategorie** | Art des Anliegens (siehe unten) |
| **Beschreibung** | Ausführliche Beschreibung des Problems oder Vorschlags |

**Verfügbare Kategorien:**
- Fehler melden
- Problem mit einem Befehl
- Problem mit einer Funktion
- Verbesserungsvorschlag
- Allgemeine Frage
- Sonstiges

Nach dem Absenden erhält dein Ticket eine eindeutige Ticketnummer im Format \`AST-YYYYMMDD-XXXX\`.`,
    },
    {
      id: 'ticketstatus',
      title: 'Ticketstatus',
      level: 2,
      content: `Jedes Ticket durchläuft verschiedene Status:

| Status | Anzeige | Bedeutung |
|---|---|---|
| \`open\` | Offen | Das Ticket wartet auf Bearbeitung |
| \`in_progress\` | Wird bearbeitet | Der Support kümmert sich aktiv um das Anliegen |
| \`resolved\` | Gelöst | Das Anliegen wurde abgeschlossen |

Statusänderungen werden als Systemnachrichten im Nachrichtenverlauf angezeigt.`,
    },
    {
      id: 'nachrichtenverlauf',
      title: 'Nachrichtenverlauf',
      level: 2,
      content: `Jedes Ticket enthält einen Nachrichtenverlauf, über den du mit dem Support-Team kommunizieren kannst.

**Nachrichtentypen:**
- **Benutzernachrichten** – Deine eigenen Nachrichten
- **Support-Antworten** – Antworten des Support-Teams, gekennzeichnet mit dem Verfassernamen und dem Badge „Astra Support"
- **Systemnachrichten** – Automatische Hinweise bei Statusänderungen, Ticketerstellung und Wiedereröffnung

**Intelligentes Scroll-Verhalten:**
- Beim Senden einer eigenen Nachricht scrollt der Chat automatisch nach unten
- Bei eingehenden Nachrichten bleibt die Scrollposition erhalten, wenn du ältere Nachrichten liest
- Eine Hinweisbox informiert über neue Nachrichten und ermöglicht das Springen zum Chatende

Der Nachrichtenverlauf wird automatisch per Polling aktualisiert.`,
    },
    {
      id: 'ticket-wiederoeffnen',
      title: 'Gelöste Tickets wieder öffnen',
      level: 2,
      content: `Gelöste Tickets bleiben vollständig einsehbar. Du kannst den gesamten Nachrichtenverlauf weiterhin lesen.

Wenn dein Anliegen nicht vollständig gelöst wurde, kannst du das Ticket über den Button **„Ticket wieder öffnen"** erneut öffnen.

Dabei passiert Folgendes:
- Der Status wird auf \`open\` zurückgesetzt
- Eine Systemnachricht wird erzeugt
- Das Ticket erscheint wieder in der aktiven Support-Übersicht
- Der gesamte bisherige Nachrichtenverlauf bleibt erhalten

**Hinweis:** Auf ein gelöstes Ticket kann nicht direkt geantwortet werden. Es muss zuerst wieder geöffnet werden.`,
    },
    {
      id: 'navigation',
      title: 'Navigation im Supportbereich',
      level: 2,
      content: `Der Supportbereich ist als Master-Detail-Ansicht aufgebaut:

- **Links:** Deine persönliche Ticketübersicht mit allen Tickets
- **Rechts:** Ticket-Erstellungsformular oder geöffneter Ticket-Chat

**Aktionen:**
- Klick auf ein Ticket öffnet den Nachrichtenverlauf im Detailbereich
- Das ausgewählte Ticket wird in der Übersicht hervorgehoben
- Über **„Zurück zur Übersicht"** verlässt du den Chat und kehrst zum Erstellungsformular zurück
- Das Verlassen des Chats verändert weder den Ticketstatus noch den Nachrichtenverlauf`,
    },
    {
      id: 'prioritaeten',
      title: 'Prioritäten',
      level: 2,
      content: `Tickets können vom Support-Team mit einer Priorität versehen werden:

| Priorität | Bedeutung |
|---|---|
| \`low\` | Niedrig – Kein dringender Handlungsbedarf |
| \`normal\` | Normal – Standardpriorität |
| \`high\` | Hoch – Sollte zeitnah bearbeitet werden |
| \`critical\` | Kritisch – Erfordert sofortige Aufmerksamkeit |

Die Priorität wird vom Support-Team festgelegt und kann jederzeit angepasst werden.`,
    },
  ],
};
