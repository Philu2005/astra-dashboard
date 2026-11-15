# ROADMAP.md - Entwicklungsphasen und Fortschritt

## Phase 1: Frontend-Grundlagen (Abgeschlossen)
- [x] Projektanalyse und Initialisierung der Dokumentation
- [x] Einrichtung der Entwicklungsumgebung (Vite, React, TypeScript)
- [x] Installation von Tailwind CSS und shadcn/ui
- [x] Festlegung der Projektstruktur (Folder Structure)
- [x] Erstellung der Basis-Layouts (Sidebar, Navigation)
- [x] Mobile Optimierung (Responsive Design für Basis-Layout)

## Phase 2: UI-Komponenten und Seiten (In Arbeit)
- [x] Implementierung der Dashboard-Hauptseite (Visuelle Umsetzung)
- [x] Forensische Designanalyse der Referenz (Pixel-Perfect Vorbereitung)
- [x] Pixel-Perfect Überarbeitung (Desktop 1536x864, Sidebar 260px, Topbar 90px)
- [x] Implementierung des Area-Charts (SVG) entsprechend der Referenz
- [x] Implementierung: Vollständiger Discord OAuth2 Login (Frontend & Backend)
- [x] Serverauswahl und Übersicht
- [ ] Entwicklung der Modlog- und Automod-Ansichten
- [ ] Ticketsystem-Interface
- [x] Statistiken und Aktivitätslogs (Mock-Daten & UI)
- [x] Vollständige responsive Umsetzung der Dashboard-Seite

## Phase 3: Backend-Vorbereitung (Abgeschlossen)
- [x] Spezifikation und Implementierung der API-Endpunkte (FastAPI)
- [x] Serverseitiges Session-Management (In-Memory → MySQL)
- [x] Discord OAuth2 Integration
- [x] Migration auf persistente MySQL-Sessions (aiomysql, SHA-256 Token-Hashing, 30-Tage-Laufzeit)
- [x] Interner Astra Bot API-Client (httpx, async, Fehlerbehandlung)
- [x] Dashboard-Endpoints: GET /api/servers, /api/servers/{guild_id}, /api/servers/{guild_id}/roles, /api/status
- [x] Session-basierte User-ID-Extraktion für alle API-Aufrufe

## Phase 4: Refactoring & Security Hardening (Abgeschlossen)
- [x] Bestandsaufnahme: Vollständige Analyse von Frontend und Backend
- [x] Startup-Validierung für kritische Konfiguration (SESSION_SECRET, Discord Credentials)
- [x] Unsicheren SESSION_SECRET Default entfernt
- [x] Inaktivitäts-Timeout für Sessions implementiert (SESSION_INACTIVITY_TIMEOUT)
- [x] CORS-Headers eingeschränkt (allow_headers/allow_methods auf benötigte Werte)
- [x] Session-IDs und Secrets aus Log-Ausgaben entfernt
- [x] Diagnose-Logs in /auth/me bereinigt
- [x] Hardcoded Backend-URL im Frontend durch konfigurierbare Umgebungsvariable ersetzt
- [x] .env.example mit allen benötigten Variablen erstellt
- [x] Origin-Validierung beim Logout gegen CORS-Whitelist
- [x] `any`-Typ in api-client.ts durch `unknown` ersetzt
- [x] SECURITY.md vollständig aktualisiert mit implementierten und offenen Maßnahmen
- [x] 7 neue Tests: Inaktivitäts-Timeout, Security-Endpunkte, Eingabevalidierung
- [x] TypeScript-Prüfung bestanden
- [x] Frontend-Build erfolgreich
- [x] Backend-Tests: 26/26 bestanden

## Phase 5: Dokumentationsplattform (Abgeschlossen)
- [x] Vollständige Analyse der bestehenden Projektstruktur und Markdown-Dokumentation
- [x] Interaktive Dokumentationsplattform unter `/docs` implementiert
- [x] 15 Artikel in 5 Kategorien erstellt (Erste Schritte, Serververwaltung, Sicherheit, Technik, Hilfe)
- [x] Volltextsuche mit Command-Palette-UI und Tastaturnavigation
- [x] Dreispaltige Artikelansicht (Navigation, Inhalt, Inhaltsverzeichnis)
- [x] Markdown-Rendering mit Syntax-Highlighting, Tabellen, Codeblöcke mit Copy-Button
- [x] Lesefortschrittsanzeige, Artikel-Feedback, Prev/Next-Navigation
- [x] Responsive Design (Desktop, Tablet, Mobile mit Drawer-Navigation)
- [x] Sidebar-Link „Dokumentation" auf `/docs` aktualisiert
- [x] Ursprüngliche Markdown-Dokumentationsdateien nach Migration gelöscht
- [x] TypeScript-Prüfung bestanden
- [x] Vite-Build erfolgreich

## Phase 6: Status & Monitoring (Abgeschlossen)
- [x] Monitoring-Service mit periodischem Scheduler (120s Intervall)
- [x] 6 Dienste überwacht: Landing Page, Dashboard, Astra API, Astra Bot, MySQL, Discord
- [x] DB-Tabellen: status_services, status_checks, status_incidents, status_heartbeats
- [x] Automatische Störungserkennung und -behebung
- [x] Öffentliche Status Page unter /status mit 90-Tage-Historienbalken
- [x] Öffentliche API-Endpunkte: GET /api/status/, /api/status/services, /api/status/incidents
- [x] Authentifizierter Heartbeat-Endpunkt: POST /api/status/heartbeat
- [x] Gewichtete Gesamtstatusberechnung und zeitbasierte Uptime-Berechnung
- [x] Navigation: Landing Page Navbar + Dashboard Sidebar
- [x] TypeScript-Prüfung bestanden
- [x] Vite-Build erfolgreich

## Fortschrittsprotokoll
- **2026-11-15:** Navbar für Docs, Status und Homepage überarbeitet: Eine neue, zentrale `SharedNavbar`-Komponente wurde implementiert, die das hochwertige Design der Landingpage im gesamten Projekt vereinheitlicht. Features: visuelle Indikatoren für aktive Routen, konsistente Astra-Purple/Cyan-Highlights, Backdrop-Blur, responsive Drawer-Navigation und Unterstützung für seiten-spezifische Inhalte (z. B. Docs-Suche). Veraltete Header-Implementierungen in `DocsPage.tsx` und `StatusPage.tsx` wurden ersetzt. Sidebar-Positionierung in den Docs für Sticky-Header korrigiert. TypeScript-Prüfung und Build erfolgreich.
- **2026-11-15:** Bot-Status und Incident-Aufloesung korrigiert: (1) _check_heartbeat fragte nur die lokale DB-Tabelle status_heartbeats ab, aber der Astra Bot schreibt dort nicht - er exponiert Heartbeat-Daten ueber seine eigene API (/status). Fix: Heartbeat-Check fragt nun primaer die Astra Bot API ab und mappt online:true + status:online korrekt auf operational, mit DB-Fallback. (2) _calculate_overall_status ignorierte aktive Incidents. Fix: Aktive Incidents begrenzen den Status auf maximal degraded. 9 neue Monitoring-Tests (alle bestanden). TypeScript-Pruefung und Build erfolgreich.
- **2026-11-15:** Vollständiges Status- und Monitoring-System implementiert: Backend-Monitoring-Service mit 6 Prüfungen (HTTP, Astra API, Heartbeat, MySQL, Discord), periodischem Scheduler, Störungsverwaltung und gewichteter Statusberechnung. 4 neue DB-Tabellen. Öffentliche Status Page unter /status mit Dienstkarten, 90-Tage-Historienbalken, Störungshistorie und automatischer Aktualisierung. Navigation in Landing Page Navbar und Dashboard Sidebar ergänzt.
- **2026-11-14:** Support-System Bugfix: HTTP-500-Fehler beim Laden von Tickets behoben (Ursache: `%s` in `DATE_FORMAT`-SQL-Strings kollidierte mit aiomysql-Parameterplatzhaltern – durch `%%s`-Escaping gelöst). Admin-Kennzahlen-Übersicht zeigt nun Fehlerzustand statt endlosem „Laden…" an (`AdminTicketsPage.tsx`). TypeScript-Prüfung und Build erfolgreich.
- **2026-11-14:** Kritischen API-Routing-Fehler behoben (doppeltes `/api/api/`-Prefix): Frontend-Services (`server-api.ts`, `useDashboardStats.ts`, `LandingPage.tsx`) korrigiert – Endpoints übergeben nun relative Pfade ohne `/api`-Prefix, da `apiClient` diesen bereits als Basis verwendet. `/api/health`-Route im Backend ergänzt. Dev-Guard `assertNoDoubleApiPrefix()` in `api-client.ts` hinzugefügt. TypeScript-Prüfung und Build erfolgreich.
- **2026-11-14:** Migration auf persistente MySQL-Sessions abgeschlossen: In-Memory SessionManager durch async MySQL-basierten SessionManager ersetzt (aiomysql Connection-Pool). Drei Tabellen (dashboard_sessions, oauth_states, oauth_exchange_tokens) mit SHA-256 Token-Hashing, atomarer State/Exchange-Token-Konsumierung und idempotenter Tabellenerstellung. Session-Laufzeit auf 30 Tage (SESSION_MAX_AGE + SESSION_INACTIVITY_TIMEOUT). FastAPI-Lifespan für Pool-Init/Shutdown und stündliche Bereinigung. Alle Aufrufer (auth/router.py, servers/router.py) auf async/await umgestellt. Umfassende async Integrationstests erstellt. Keine Frontend-Änderungen.
- **2026-11-13:** Refactoring & Security Hardening durchgeführt: Vollständige Bestandsaufnahme von Frontend und Backend, Startup-Validierung für kritische Konfiguration eingeführt, unsicheren SESSION_SECRET Default entfernt, Inaktivitäts-Timeout für Sessions implementiert, CORS-Headers auf benötigte Werte eingeschränkt, Session-IDs aus Logs entfernt, hardcoded Backend-URL im Frontend durch Umgebungsvariable ersetzt, `.env.example` erstellt, SECURITY.md aktualisiert. 7 neue Tests hinzugefügt (26/26 bestanden), TypeScript-Prüfung und Build erfolgreich. Discord OAuth2-Login bleibt vollständig funktionsfähig.
- **2026-11-13:** Entwicklungsstart vereinheitlicht: `npm run dev` startet nun Frontend und Backend parallel via `concurrently` mit klaren Präfixen (`FRONTEND`/`BACKEND`) und gekoppeltem Shutdown. Zusätzlich lokale Host-Konsistenz für Cookie-/CORS-relevante Origins in `backend/.env` auf `127.0.0.1` umgestellt (`FRONTEND_URL`, `CORS_ORIGINS`).
- **2026-11-13:** Discord OAuth2-Flow und Session-Handling repariert: Frontend-Login-Loop in `App.tsx`/`AuthContext` behoben (kontrollierter Login-Start, robuster Statusfluss, verbesserte Fehlerabbildung), Backend-Auth-Router/Service gehärtet (strukturierte OAuth2-Logs ohne Secrets, State-Cookie mit konsistentem Pfad, stabilerer Logout-Origin-Prüfung, robustere Discord-Fehlerbehandlung). Zusätzlich ein datenschutzfreundliches Cookie-Consent-System integriert (Banner + Einstellungsdialog + Versionierung/Zeitpunkt + Widerruf, dauerhafter Einstieg „Cookie-Einstellungen“ auf Homepage und im Dashboard).
- **2026-11-13:** Implementierung des vollständigen Discord OAuth2 Logins. Eigenständiges FastAPI-Backend mit Session-Verwaltung, Secure-Cookies und State-Validierung erstellt. Frontend um `AuthContext` erweitert, Dashboard-Zugriffsschutz implementiert und Topbar mit echten Discord-Benutzerdaten (Anzeigename, Avatar, Logout-Dropdown) verknüpft.
- **2026-11-10:** Initialisierung des Projekts. Dokumentationsdateien (AGENTS, PROJECT, DESIGN, SECURITY, ROADMAP) erstellt. Analyse des Ist-Zustands abgeschlossen.
- **2026-11-10:** Frontend-Stack initialisiert (Vite, React, TypeScript, Tailwind v4). Projektstruktur und Konfigurationen für shadcn/ui vorbereitet.
- **2026-11-10:** Erste visuelle Umsetzung des Dashboards abgeschlossen. Sidebar, Topbar und Hauptbereich (Dashboard) implementiert.
- **2026-11-10:** Umfassende visuelle Korrektur des Dashboards durchgeführt. Proportionen, Abstände und Typografie an 1536x864 Referenz angepasst. Hintergrund-Glows und Karten-Styles verfeinert. Layout für bessere Platzausnutzung optimiert.
- **2026-11-10:** Gezielte Layoutkorrektur umgesetzt: Breitenlimit im Dashboard entfernt, Main-Layout auf volle Restbreite neben 260px-Sidebar korrigiert und unteres Inhaltsgrid auf fluides 70/30-`minmax()`-Schema für bessere Desktop-/Tablet-/Mobile-Breitenanpassung umgestellt.
- **2026-11-10:** Weitere Pixel-Annäherung an die Master-Referenz: Radius-/Border-/Schatten-Tokens präzisiert, Sidebar/Topbar visuell nachgeschärft, Card-Hierarchie und Chart-Darstellung verfeinert sowie DESIGN-Spezifikation erweitert.
- **2026-11-10:** Präzise Reproduktionsrunde durchgeführt: Layout- und Typografie-Feinjustierung für Sidebar/Topbar/Main-Spacing, Kartenhierarchie (Stats/Schnellzugriff/Aktivitäten/Bot-Status) sowie Chart-Lesbarkeit (Grid/Labels) mit Fokus auf 1536x864-Referenzproportionen; Build erneut erfolgreich verifiziert.
- **2026-11-10:** Visuelle Browser-Testumgebung mit Playwright eingerichtet: automatisierter Start/Reuse des Vite-Servers, reproduzierbare Screenshots für definierte Viewports (inkl. 1536x864) unter `tests/visual` ergänzt und npm-Skripte für visuelle Testläufe hinzugefügt.
- **2026-11-10:** Erste echte Vergleichsrunde mit der Master-Referenz durchgeführt; gezielte Korrekturen ausschließlich an Sidebar und Topbar umgesetzt (Branding, Navigation, Icon-/Text-Hierarchie, Mobile-Drawer-Verhalten, Profil-/Benachrichtigungsbereich) sowie visuell per Playwright (1536x864, 1024x768, 390x844) und technisch per Build validiert.
- **2026-11-10:** Grundlegende visuelle Neugestaltung der Dashboard-Startseite umgesetzt: globale Farbtokens und Hintergrundwirkung konsolidiert, Sidebar/Topbar vollständig neu proportioniert, Kartenoberflächen und Typografie-Hierarchie überarbeitet sowie Schnellzugriff, Aktivitäten, Bot-Status und Befehlsdiagramm einheitlich im Astra-Stil harmonisiert. Visuelle Prüfung per Playwright auf 1536x864, 1920x1080, 1366x768, 1024x768, 768x1024 und 390x844 erfolgreich; `npx tsc --noEmit` und `npm run build` erfolgreich.
- **2026-11-10:** Referenznahe Gesamtrevision der Startseite in einem Durchgang abgeschlossen: Hintergrund vollständig neu (dezente violett/cyan Lichtakzente statt großer Ringformen), Sidebar ohne Branding-Trennlinie, Topbar harmonisiert, Kartenproportionen und Hauptlayout (4er-Stats + zweispaltiger Contentbereich) präzisiert sowie Bot-Status/Chart-Card referenznäher skaliert. Befehlsdiagramm technisch erneuert (interaktive Datenpunkte, robuster Tooltip mit Tageslabel/Exaktwert, keine zusätzliche „0“, kein Card-Overflow) und Astra-Loader inkl. reduzierter Bewegungen (`prefers-reduced-motion`) ergänzt. Verifiziert mit `npm run build` und `npm run test:visual` für 1536x864, 1920x1080, 1366x768, 1024x768, 768x1024, 390x844; Screenshots unter `tests/visual/screenshots` geprüft.
- **2026-11-10:** UI-Feinschliff gemäß Feedback umgesetzt: Chart-Tooltip kompakter und optisch aufgewertet, Topbar-Farbe leicht aufgehellt und Sidebar bewusst etwas dunkler abgestimmt, „Astra einladen“-Button konsistent gestylt (auch ohne Invite-URL), mobiler Close-Button in der Sidebar neu positioniert (blockiert Logo nicht mehr) sowie Border-/Icon-Farben näher an die Referenz gebracht. Verifiziert mit `npm run -s tsc -- --noEmit` und `npm run build`.
- **2026-11-10:** Weitere Korrekturrunde nach mobilem UI-Feedback umgesetzt: Close-Button der mobilen Sidebar in den Branding-Headerfluss verlegt (ohne Logo-Überlagerung), „Astra einladen“-CTA zusätzlich direkt in der mobilen Sidebar ergänzt und identisch animiert/gestylt, Topbar-/Sidebar-Farbtöne erneut referenznäher angepasst sowie Box-Icons in Stat-, Quick-Access- und Aktivitätskarten minimal vergrößert.
- **2026-11-10:** Mobile Sidebar gemäß weiterem Layout-Feedback vereinfacht: separates `X` zum Schließen entfernt, Hamburger-Button als fixer linker Toggle beibehalten und Branding-Bereich mobil nach rechts versetzt, sodass Icon + „Astra Dashboard“ nicht mehr mit dem Toggle kollidieren.
- **2026-11-10:** Mobile Sidebar erneut überarbeitet: Hamburger-Button blendet bei geöffnetem Drawer aus, Overlay und Drawer visuell beruhigt (cleaner/modern), mobiler Header ohne künstlichen Offset neu ausgerichtet sowie Typografie-/Spacing-Hierarchie der mobilen Navigation an den Desktop-Stil angenähert.
- **2026-11-10:** Kleine UI-Korrektur umgesetzt: Icons im Bereich „Letzte Aktivitäten“ auf `25px` vergrößert, damit die visuelle Gewichtung konsistent mit den übrigen Karten-Icons bleibt. Verifiziert mit `npm run build`.
- **2026-11-10:** Farbangleichung für Sidebar/Topbar gemäß Master-Referenz umgesetzt: zentrale Layout-Tokens für Sidebar `#0F0F1B`, Topbar `#131522`, Divider `#212131` und Hover `#1A1A2A` ergänzt und ausschließlich auf direkte Sidebar-/Topbar-Flächen samt zugehöriger Border-/Hover-Zustände angewendet; Layoutmaße und übrige Dashboard-Komponenten unverändert belassen.
- **2026-11-10:** Mobile Sidebar-Interaktion nachgeschärft: Hamburger-Icon wird nach vollständig abgeschlossenem Öffnen im mobilen Branding-Header links neben Icon + „Astra Dashboard“ wieder eingeblendet (mit verzögerter Animation) und dient dort als Schließen-Trigger.
- **2026-11-10:** Mobile Header-Hamburger weiter verfeinert: Style des eingeblendeten Buttons im geöffneten Drawer 1:1 an den ursprünglichen mobilen Toggle angeglichen (Größe, Farben, Border, Shadow, Icon-Maße), damit kein visueller Unterschied mehr besteht.
- **2026-11-10:** Mobiles Sidebar-/Chart-Feintuning umgesetzt: „Astra einladen“-CTA in der mobilen Sidebar ans untere Ende verlagert (Footer-Bereich) und Chart-Box auf kleinen Viewports responsiver gemacht (kompaktere Card-Padding/Headline/Abstände sowie angepasste Label-Skalierung) für bessere Lesbarkeit ohne Layout-Brüche.
- **2026-11-10:** Umfangreiche Produktstruktur-Erweiterung umgesetzt: öffentliche Homepage unter `/` im bestehenden Astra-Designsystem integriert (responsive Navigation, Hero, Features, Dashboard-Vorschau, Statistiken, CTA, Footer), Dashboard sauber auf `/dashboard` separiert und Platzhalterseiten für `/login`, `/docs`, `/support` ergänzt. Zentrale `AstraLogo`-Komponente auf Basis von `src/assets/Astra.png` eingeführt und bisherige Branding-Sparkles in Sidebar/Loader/Homepage gezielt ersetzt. Visuell/technisch verifiziert mit `npm run build` und `npm run test:visual` (11/11 grün, inkl. Homepage+Dashboard-Screenshots für 1920x1080, 1536x864, 1024x768, 768x1024, 390x844).
- **2026-11-10:** Hero-Produktdemo auf der öffentlichen Homepage vollständig neu entwickelt und bisheriges Linien/Kreis/Partikel-Visual ersetzt: neue modulare React-Szenen (`Live Analytics`, `Automod`, `Community Netzwerk`, `Ticketsystem`, `Dashboard Module`) mit zentraler Timeline, sanften Crossfades, Progress-Indikator, responsiver Box-Skalierung (Desktop ca. 440–500px Breite) sowie Performance-/Accessibility-Berücksichtigung (`prefers-reduced-motion`, Pausierung der Timeline außerhalb des Viewports). Dazu wurden dedizierte Animations-Keyframes/-Styles in `src/index.css` ergänzt.
- **2026-11-10:** Hero-Produktdemo gezielt auf Qualitäts- und Motion-Level angehoben: alle fünf Slides in `AstraHeroProductDemo.tsx` inhaltlich verdichtet (mehr echte Dashboard-Details, Status-/KPI-/Badge-Hierarchie, kompaktere Card-Strukturen) und visuell auf die Astra-Designsprache harmonisiert. Für die Konfigurationsszene wurde Cursor + Toggle technisch neu aufgebaut: ein gemeinsamer `requestAnimationFrame`-Ablauf steuert die gesamte Sequenz (Cursor erscheint, bewegt sich präzise zum Toggle, Klickbewegung, Toggle schaltet exakt im Klickmoment, Cursor fährt aus und blendet aus). In `src/index.css` wurden die alten entkoppelten Keyframes ersetzt, moderne Surface-/Glow-/Border-Details ergänzt und der Toggle mit weichen, GPU-freundlichen `transform`/`opacity`-Transitions verfeinert.
- **2026-11-11:** Websiteweite Logo-Integration finalisiert und Branding-Vorgaben präzisiert: `AstraLogo`-Komponente nutzt nun `scale-[1.18]` im `fill`-Modus, um Logo-Container lückenlos auszufüllen. Gemäß Nutzerfeedback wurden alle Logo-Container (Navbar, Features, Footer, Loader, Dashboard, Sidebar) mit hochwertigen, leicht abgerundeten Ecken (`rounded-xl` / `rounded-2xl`) versehen, wobei durch `overflow-hidden` sichergestellt wurde, dass das Logo die Form exakt ausfüllt und keine Hintergrundränder sichtbar sind. Glow-Effekte und präzise Border-Farben wurden zur Veredelung der integrierten Optik beibehalten.
