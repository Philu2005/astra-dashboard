# PROJECT.md - Astra Dashboard

## Projektziel
Entwicklung eines modernen, hochwertigen und vollständig responsiven Web-Dashboards für den Discord-Bot "Astra". Das Dashboard dient zur Verwaltung von Server-Einstellungen, Statistiken und Community-Features.

## Technologie-Stack
- **Frontend:** React 19, TypeScript, Vite 8
- **Styling:** Tailwind CSS 4, shadcn/ui, Lucide Icons
- **Backend:** FastAPI (Python), HTTPX, python-dotenv
- **Entwicklungsumgebung:** Node.js 20.20.2+, npm 10.8.2+

## Architektur
Das Projekt besteht aus einem React-Frontend und einem FastAPI-Backend.
- **Authentifizierung:** Discord OAuth2 (identify scope).
- **Session-Management:** Serverseitige MySQL-Sessions mit SHA-256 Token-Hashing und HttpOnly-Cookies.
- **Redis:** Optionaler Dienst (Docker) für zukünftiges Caching/Rate-Limiting – kein Einfluss auf Sessions.
- **Sicherheit:** State-Validierung, CORS-Protection, Secure-Cookies (in Produktion).
- **Zustand:** Das Frontend nutzt einen zentralen `AuthContext` zur Verwaltung des Authentifizierungsstatus.
- **Consent-Management:** Zentrales Cookie-Consent-System mit Banner, Einstellungsdialog, Versionierung und Widerrufmöglichkeit über „Cookie-Einstellungen".

## Infrastruktur (Ziel)
- **Betriebssystem:** Ubuntu 24.04 LTS
- **Webserver:** Apache2
- **Domains:**
  - test.astra-bot.de
  - api-test.astra-bot.de
  - astra-bot.de
