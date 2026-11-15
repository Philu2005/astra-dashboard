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

## Sicherheit

- **HttpOnly Cookies**: Session-IDs sind nicht über JavaScript zugänglich.
- **State-Validierung**: Schutz gegen CSRF während des OAuth-Flows.
- **MySQL Sessions**: Sessions werden persistent in MySQL gespeichert (SHA-256 Token-Hashing, TTL, Inaktivitäts-Timeout).
- **CORS**: Streng konfigurierte Origins (nur das Frontend hat Zugriff).
