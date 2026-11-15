# Astra Backend - Setup & Dokumentation

Dieses Backend stellt die OAuth2-Authentifizierung über Discord für das Astra Dashboard bereit.

## Voraussetzungen

- Python 3.9+
- Discord Developer Application

## Installation

1. Navigiere in das `backend` Verzeichnis:
   ```bash
   cd backend
   ```

2. Erstelle eine virtuelle Umgebung (optional aber empfohlen):
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Unter Windows: .venv\Scripts\activate
   ```

3. Installiere die Abhängigkeiten:
   ```bash
   pip install -r requirements.txt
   ```

4. Konfiguriere die Umgebungsvariablen:
   Kopiere `.env.example` zu `.env` und trage deine Discord-Zugangsdaten ein.

## Discord Developer Portal Einstellungen

Um den Login zu ermöglichen, müssen folgende Einstellungen im [Discord Developer Portal](https://discord.com/developers/applications) vorgenommen werden:

1. Wähle deine Application aus.
2. Gehe zu **OAuth2** -> **General**.
3. Füge unter **Redirects** folgende URI hinzu:
   `http://127.0.0.1:8000/auth/discord/callback`
4. Kopiere die **Client ID** und das **Client Secret** in deine `.env` Datei.

## Starten des Backends

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Das Backend ist dann unter `http://127.0.0.1:8000` erreichbar.

## API Endpunkte

- `GET /auth/discord/login`: Startet den OAuth2-Flow (Weiterleitung zu Discord).
- `GET /auth/discord/callback`: Callback für Discord (setzt Session-Cookie).
- `GET /auth/me`: Liefert das aktuelle Benutzerprofil (erfordert Session).
- `POST /auth/logout`: Invalidiert die Session und löscht das Cookie.

## Redis (optional)

Redis steht als optionaler Dienst für zukünftige Funktionen bereit (z. B. Rate-Limiting, Caching, temporäre Daten).

**Die Session-Verwaltung bleibt in MySQL.** Redis hat keinen Einfluss auf Login oder Sessions.

### Redis starten

```bash
# Im Projektroot
docker compose -f docker-compose.redis.yml up -d
```

### Konfiguration

In `backend/.env` die Redis-URL setzen:

```
REDIS_URL=redis://:dein_passwort@127.0.0.1:6379/0
```

Wenn `REDIS_URL` leer ist, startet das Backend ohne Redis – alle Funktionen bleiben verfügbar.

### Redis-Status prüfen

Der Health-Endpunkt `/api/health` zeigt den Redis-Status:

```json
{"status": "healthy", "redis": "connected"}
```

Mögliche Werte für `redis`: `connected` oder `unavailable`.

### Architektur

- **Docker-Container:** `astra-redis` (Redis 7 Alpine)
- **Netzwerk:** Nur über `127.0.0.1:6379` erreichbar (nicht öffentlich)
- **Persistenz:** AOF (Append-Only File) mit `everysec`-Sync
- **Speicherlimit:** 128 MB mit LRU-Eviction
- **Passwort:** Über `REDIS_PASSWORD` Umgebungsvariable im Docker-Compose
- **Healthcheck:** Automatischer Ping alle 30 Sekunden
- **Neustart:** `unless-stopped` Policy

### Fehlerverhalten

- Redis-Ausfall hat **keine Auswirkung** auf Login, Sessions oder OAuth2.
- Das Backend loggt einen Fehler und arbeitet ohne Redis weiter.
- Kein unsicherer Fallback – Redis wird nur für optionale Dienste genutzt.

### Zukünftige Einsatzgebiete

- API-Rate-Limiting pro User/IP
- Kurzzeit-Caching von Discord-API-Antworten
- Temporäre Daten (z. B. Benachrichtigungen, Locks)

## Sicherheit

- **HttpOnly Cookies**: Session-IDs sind nicht über JavaScript zugänglich.
- **State-Validierung**: Schutz gegen CSRF während des OAuth-Flows.
- **MySQL Sessions**: Sessions werden persistent in MySQL gespeichert (SHA-256 Token-Hashing, TTL, Inaktivitäts-Timeout).
- **CORS**: Streng konfigurierte Origins (nur das Frontend hat Zugriff).
- **Redis**: Nur über localhost erreichbar, passwortgeschützt, kein Einfluss auf Authentifizierung.
