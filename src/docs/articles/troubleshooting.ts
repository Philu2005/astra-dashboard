import type { DocArticle } from '../types';

export const troubleshooting: DocArticle = {
  slug: 'troubleshooting',
  title: 'Fehlerbehebung',
  description: 'Häufige Probleme und deren Lösungen.',
  category: 'Hilfe & Fehlerbehebung',
  categorySlug: 'hilfe',
  readingTime: 5,
  popular: true,
  sections: [
    {
      id: 'login-probleme',
      title: 'Login-Probleme',
      level: 2,
      content: `**„Autorisierung abgebrochen"**
- **Ursache:** Du hast bei Discord auf „Abbrechen" geklickt
- **Lösung:** Erneut über \`/login\` anmelden

**„Sicherheitsvalidierung fehlgeschlagen"**
- **Ursache:** State-Token ungültig (z.B. veralteter Tab, doppelter Klick)
- **Lösung:** Seite neu laden und erneut anmelden

**„Anmeldung abgelaufen"**
- **Ursache:** Login-Vorgang hat länger als 10 Minuten gedauert
- **Lösung:** Erneut anmelden

**„Token-Austausch fehlgeschlagen"**
- **Ursache:** Kommunikationsproblem mit Discord oder Exchange-Token abgelaufen (60s)
- **Lösung:** Kurz warten und erneut versuchen`,
    },
    {
      id: 'session-probleme',
      title: 'Session-Probleme',
      level: 2,
      content: `**Session läuft unerwartet ab**
- **Ursache:** \`SESSION_MAX_AGE\` oder \`SESSION_INACTIVITY_TIMEOUT\` zu kurz konfiguriert
- **Diagnose:** Prüfe die Werte in \`backend/.env\`
- **Lösung:** Werte anpassen (Standard: 2592000 = 30 Tage)

**Nach Neustart des Backends abgemeldet**
- **Ursache:** Sessions werden in MySQL gespeichert und überleben Neustarts. Falls die Datenbank zurückgesetzt wurde, gehen Sessions verloren.
- **Lösung:** Erneut anmelden`,
    },
    {
      id: 'api-fehler',
      title: 'API-Fehler',
      level: 2,
      content: `**„Astra ist derzeit nicht erreichbar" (503)**
- **Ursache:** Die interne Astra Bot API (\`ASTRA_INTERNAL_API_URL\`) ist nicht erreichbar
- **Diagnose:** Prüfe ob der Astra Bot läuft und die URL korrekt ist
- **Lösung:** Bot starten oder URL in \`backend/.env\` korrigieren

**„Zeitüberschreitung" (504)**
- **Ursache:** Die Bot-API antwortet nicht innerhalb von 10 Sekunden
- **Lösung:** Bot-Performance prüfen, ggf. Timeout erhöhen

**„Interner Fehler" (502)**
- **Ursache:** Ungültiger API-Key oder unerwartete Antwort der Bot-API
- **Diagnose:** Backend-Logs prüfen
- **Lösung:** \`ASTRA_INTERNAL_API_KEY\` in \`backend/.env\` prüfen`,
    },
    {
      id: 'cors-probleme',
      title: 'CORS-Probleme',
      level: 2,
      content: `**CORS-Fehler im Browser**
- **Ursache:** Frontend-Origin nicht in \`CORS_ORIGINS\` konfiguriert
- **Diagnose:** Browser-Konsole zeigt den blockierten Origin
- **Lösung:** Origin zu \`CORS_ORIGINS\` in \`backend/.env\` hinzufügen (kommasepariert)

**Cookies werden nicht gesendet**
- **Ursache:** \`SameSite\`- oder \`Secure\`-Einstellungen stimmen nicht
- **Diagnose:** Browser-DevTools → Application → Cookies prüfen
- **Lösung:** In lokaler Entwicklung \`SESSION_COOKIE_SECURE=false\` setzen`,
    },
    {
      id: 'datenbank-probleme',
      title: 'Datenbank-Probleme',
      level: 2,
      content: `**Backend startet nicht (Datenbankfehler)**
- **Ursache:** MySQL nicht erreichbar oder Zugangsdaten falsch
- **Diagnose:** Backend-Logs prüfen
- **Lösung:** \`DB_HOST\`, \`DB_PORT\`, \`DB_USER\`, \`DB_PASSWORD\` in \`backend/.env\` prüfen

**Tabellen fehlen**
- **Ursache:** \`init_tables()\` konnte nicht ausgeführt werden
- **Lösung:** Backend neu starten – Tabellen werden automatisch erstellt (IF NOT EXISTS)`,
    },
    {
      id: 'frontend-build',
      title: 'Frontend-Build-Probleme',
      level: 2,
      content: `**TypeScript-Fehler beim Build**
- **Diagnose:** \`npx tsc --noEmit\` ausführen
- **Lösung:** Angezeigte Typfehler beheben

**Vite-Build schlägt fehl**
- **Diagnose:** \`npm run build\` ausführen und Fehlermeldung prüfen
- **Lösung:** Fehlende Abhängigkeiten mit \`npm install\` installieren

**Leere Seite nach Build**
- **Ursache:** Routing-Problem oder fehlende Umgebungsvariablen
- **Diagnose:** Browser-Konsole auf Fehler prüfen
- **Lösung:** \`VITE_API_BASE_URL\` und \`VITE_BACKEND_ORIGIN\` prüfen`,
    },
  ],
};
