import type { DocArticle } from '../types';

export const authentication: DocArticle = {
  slug: 'authentication',
  title: 'Authentifizierung',
  description: 'Technische Details zum Discord OAuth2-Ablauf und zur Session-Verwaltung.',
  category: 'Sicherheit & Datenschutz',
  categorySlug: 'sicherheit',
  readingTime: 5,
  sections: [
    {
      id: 'oauth2-ablauf',
      title: 'Discord OAuth2-Ablauf',
      level: 2,
      content: `Das Astra Dashboard verwendet den **Authorization Code Flow** von Discord OAuth2:

1. **Login starten** – Frontend leitet zu \`GET /auth/discord/login\`
2. **State erstellen** – Backend generiert kryptografischen State-Token, speichert Hash in MySQL
3. **Redirect zu Discord** – Nutzer autorisiert mit Scope \`identify\`
4. **Callback** – Discord ruft \`GET /auth/discord/callback\` mit Code und State auf
5. **State validieren** – Double-Submit: Cookie-State + Datenbank-State müssen übereinstimmen
6. **Code austauschen** – Backend tauscht Authorization Code gegen Access Token bei Discord
7. **Profil laden** – Backend lädt Benutzerprofil über Discord API v10
8. **Session erstellen** – Session in MySQL mit SHA-256-gehashtem Token
9. **Exchange-Token** – Einmaliges Token (60s) für Cross-Origin Cookie-Setzung
10. **Cookie setzen** – Frontend tauscht Exchange-Token gegen Session-Cookie`,
    },
    {
      id: 'exchange-token',
      title: 'Exchange-Token-Mechanismus',
      level: 2,
      content: `Das Exchange-Token-Pattern löst das Problem der Cross-Origin-Cookie-Setzung:

- Der OAuth2-Callback läuft auf dem **Backend-Origin**
- Das Session-Cookie muss auf dem **Frontend-Origin** gesetzt werden
- Das Backend erstellt ein **einmaliges Exchange-Token** (60 Sekunden gültig)
- Das Frontend ruft \`POST /auth/exchange\` auf und erhält das Session-Cookie

**Sicherheitsmerkmale:**
- Einmalig verwendbar (wird bei Einlösung gelöscht)
- 60 Sekunden Ablaufzeit
- Session-Token wird beim Exchange **rotiert** (neuer Hash)
- Atomare Transaktion in MySQL`,
    },
    {
      id: 'state-validierung',
      title: 'State-Validierung (CSRF-Schutz)',
      level: 2,
      content: `Der OAuth2-State wird doppelt validiert (Double-Submit):

1. **Cookie:** \`oauth_state\`-Cookie (HttpOnly, 10 Min. gültig)
2. **Datenbank:** SHA-256-Hash in \`oauth_states\`-Tabelle

Beide müssen übereinstimmen. Der State wird bei Validierung **atomar konsumiert** – er kann nur einmal verwendet werden.`,
    },
    {
      id: 'token-hashing',
      title: 'Token-Hashing',
      level: 2,
      content: `Alle Tokens werden ausschließlich als **SHA-256-Hash** in der Datenbank gespeichert:

\`\`\`
Klartext-Token → SHA-256 → Datenbank
\`\`\`

Dies schützt vor Token-Diebstahl bei einem Datenbank-Leak. Der Klartext existiert nur:

- Im **Cookie** des Nutzers (Session-Token)
- Kurzzeitig im **URL-Parameter** (Exchange-Token, 60s)
- Im **Cookie** (OAuth-State, 10 Min.)`,
    },
    {
      id: 'endpunkte',
      title: 'Auth-Endpunkte',
      level: 2,
      content: `| Endpunkt | Methode | Beschreibung |
|---|---|---|
| \`/auth/discord/login\` | GET | Startet OAuth2-Flow |
| \`/auth/discord/callback\` | GET | Verarbeitet Discord-Callback |
| \`/auth/exchange\` | POST | Tauscht Exchange-Token gegen Cookie |
| \`/auth/me\` | GET | Gibt aktuelle Benutzerdaten zurück |
| \`/auth/logout\` | POST | Beendet Session |`,
    },
  ],
};
