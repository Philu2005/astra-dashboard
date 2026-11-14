import type { DocArticle } from '../types';

export const supportAdmin: DocArticle = {
  slug: 'support-admin',
  title: 'Ticketverwaltung (Administration)',
  description: 'Verwaltung, Filterung und Bearbeitung von Support-Tickets als Administrator.',
  category: 'Support',
  categorySlug: 'support',
  readingTime: 6,
  sections: [
    {
      id: 'ueberblick',
      title: 'Überblick',
      level: 2,
      content: `Administratoren verwalten Support-Tickets über den Menüpunkt **Tickets** in der Sidebar. Die Verwaltungsoberfläche bietet eine vollständige Übersicht über alle eingegangenen Tickets mit Such-, Filter- und Sortierfunktionen.

**Zugriff:** Nur Benutzer mit Administrator-Berechtigung sehen den Menüpunkt „Tickets" in der Sidebar. Normale Benutzer haben keinen Zugang zur Ticketverwaltung.`,
    },
    {
      id: 'uebersicht',
      title: 'Ticketübersicht',
      level: 2,
      content: `Die Admin-Ticketübersicht besteht aus drei Bereichen:

- **Statistik-Karten** – Zähler für offene, in Bearbeitung befindliche und gelöste Tickets
- **Ticketliste** – Filterbarer und durchsuchbarer Überblick über alle Tickets
- **Detailbereich** – Vollständige Ticketansicht mit Nachrichtenverlauf

**Standardansicht:** Die aktive Übersicht zeigt nur Tickets mit Status \`open\` und \`in_progress\`. Gelöste Tickets werden standardmäßig ausgeblendet und sind über den Statusfilter „Gelöst" einsehbar.`,
    },
    {
      id: 'filter-suche',
      title: 'Filter und Suche',
      level: 2,
      content: `**Statusfilter:**

| Option | Verhalten |
|---|---|
| Auswählen | Standardansicht: \`open\` und \`in_progress\` |
| Offen | Nur \`open\` |
| Wird bearbeitet | Nur \`in_progress\` |
| Gelöst | Nur \`resolved\` |

**Suchfunktion:**
Die Suche durchsucht gleichzeitig:
- Ticketnummer (z. B. \`AST-20261114-0001\`)
- Betreff
- Benutzername

Die Suche ist case-insensitive und unterstützt Teilbegriffe.

**Weitere Filter:**
- Kategorie
- Priorität

Alle Filter sind kombinierbar und werden serverseitig angewendet.`,
    },
    {
      id: 'statusverwaltung',
      title: 'Statusverwaltung',
      level: 2,
      content: `In der Ticketdetailansicht kann der Administrator den Status jederzeit ändern:

| Aktion | Ergebnis |
|---|---|
| → Offen | Ticket wartet auf Bearbeitung |
| → Wird bearbeitet | Support kümmert sich aktiv |
| → Gelöst | Anliegen abgeschlossen |

Bei jeder Statusänderung wird automatisch eine Systemnachricht im Nachrichtenverlauf erzeugt. Wiederholte Änderungen auf denselben Status erzeugen keine doppelten Systemnachrichten.

**Automatisches Schließen:** Wenn ein Ticket auf „Gelöst" gesetzt wird, schließt sich die Detailansicht automatisch und das Ticket verschwindet aus der aktiven Übersicht.`,
    },
    {
      id: 'prioritaetsverwaltung',
      title: 'Prioritätsverwaltung',
      level: 2,
      content: `Administratoren können die Priorität eines Tickets jederzeit anpassen:

| Priorität | Bedeutung |
|---|---|
| \`low\` | Niedrig |
| \`normal\` | Normal (Standard) |
| \`high\` | Hoch |
| \`critical\` | Kritisch |

Die Änderung wird serverseitig validiert und dauerhaft gespeichert.`,
    },
    {
      id: 'antworten',
      title: 'Auf Tickets antworten',
      level: 2,
      content: `Administratoren können über das Nachrichtenfeld im Detailbereich auf Tickets antworten.

**Darstellung der Antworten:**
- Der tatsächliche Anzeigename des Administrators wird angezeigt
- Support-Antworten erhalten das Badge **„Astra Support"**
- Diese Darstellung ist in der Admin- und Benutzeransicht identisch

**Einschränkung:** Auf gelöste Tickets kann nicht geantwortet werden. Der Benutzer muss das Ticket zuerst wieder öffnen.`,
    },
    {
      id: 'benutzerprofil',
      title: 'Benutzerprofil und Tickethistorie',
      level: 2,
      content: `In der Ticketdetailansicht werden zusätzliche Informationen zum Ticket-Ersteller angezeigt:

**Benutzerprofil:**
- Discord-Benutzername und Anzeigename
- Avatar
- Erstellungsdatum des Accounts

**Ticketstatistiken:**
- Gesamtzahl der Tickets
- Offene Tickets
- In Bearbeitung befindliche Tickets
- Gelöste Tickets
- Letzte Support-Aktivität

**Tickethistorie:**
Alle bisherigen Tickets des Benutzers (außer dem aktuell geöffneten) werden mit Ticketnummer, Betreff, Status und Zeitstempel aufgelistet.`,
    },
    {
      id: 'loeschen',
      title: 'Tickets löschen',
      level: 2,
      content: `Administratoren können Tickets dauerhaft löschen. Diese Aktion ist unwiderruflich.

**Wichtig:** Das Löschen eines Tickets entfernt das Ticket und den gesamten Nachrichtenverlauf dauerhaft aus der Datenbank. Diese Funktion ist unabhängig vom Statuswechsel auf „Gelöst".`,
    },
  ],
};
