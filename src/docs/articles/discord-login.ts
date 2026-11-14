import type { DocArticle } from '../types';

export const discordLogin: DocArticle = {
  slug: 'discord-login',
  title: 'Discord-Anmeldung',
  description: 'So funktioniert die Anmeldung über Discord OAuth2.',
  category: 'Erste Schritte',
  categorySlug: 'erste-schritte',
  readingTime: 3,
  popular: true,
  sections: [
    {
      id: 'ueberblick',
      title: 'Überblick',
      level: 2,
      content: `Das Astra Dashboard verwendet **Discord OAuth2** zur Authentifizierung. Du meldest dich mit deinem bestehenden Discord-Account an – es wird kein separates Konto benötigt.

Bei der Anmeldung wird ausschließlich der OAuth2-Scope **identify** angefordert. Das bedeutet:

- ✅ Benutzername und Anzeigename
- ✅ Avatar
- ✅ Discord-User-ID
- ❌ Keine Nachrichten
- ❌ Keine Serverlisten direkt von Discord
- ❌ Keine E-Mail-Adresse`,
    },
    {
      id: 'login-ablauf',
      title: 'Login-Ablauf',
      level: 2,
      content: `1. Klicke auf **„Anmelden"** auf der Homepage oder navigiere zu \`/login\`
2. Du wirst automatisch zu Discord weitergeleitet
3. Discord zeigt dir, welche Berechtigungen Astra Dashboard anfordert
4. Klicke auf **„Autorisieren"**
5. Du wirst zurück zum Dashboard geleitet
6. Deine Session wird eingerichtet und du landest auf dem Dashboard

Der gesamte Vorgang dauert nur wenige Sekunden.`,
    },
    {
      id: 'session',
      title: 'Session und Cookies',
      level: 2,
      content: `Nach erfolgreicher Anmeldung wird ein **Session-Cookie** gesetzt:

- Das Cookie ist **HttpOnly** – JavaScript kann nicht darauf zugreifen
- Die Session ist standardmäßig **30 Tage** gültig
- Bei Inaktivität läuft die Session nach dem konfigurierten Timeout ab
- Du kannst dich jederzeit über das Profil-Menü in der Topbar abmelden

Das Session-Cookie ist technisch notwendig und unabhängig von der Cookie-Consent-Entscheidung.`,
    },
    {
      id: 'abmeldung',
      title: 'Abmeldung',
      level: 2,
      content: `So meldest du dich ab:

1. Klicke auf deinen **Avatar** in der Topbar (oben rechts)
2. Wähle **„Abmelden"** im Dropdown-Menü
3. Deine Session wird sofort beendet
4. Du wirst zur Homepage weitergeleitet

Nach der Abmeldung wird die Session serverseitig gelöscht und das Cookie entfernt.`,
    },
    {
      id: 'fehler',
      title: 'Häufige Login-Fehler',
      level: 2,
      content: `| Fehlermeldung | Ursache | Lösung |
|---|---|---|
| Autorisierung abgebrochen | Du hast bei Discord auf „Abbrechen" geklickt | Erneut anmelden |
| Sicherheitsvalidierung fehlgeschlagen | State-Token ungültig (z.B. veralteter Tab) | Seite neu laden und erneut anmelden |
| Anmeldung abgelaufen | Login-Vorgang hat zu lange gedauert | Erneut anmelden |
| Token-Austausch fehlgeschlagen | Kommunikationsproblem mit Discord | Kurz warten und erneut versuchen |
| Profil konnte nicht geladen werden | Discord-API vorübergehend nicht erreichbar | Kurz warten und erneut versuchen |`,
    },
  ],
};
