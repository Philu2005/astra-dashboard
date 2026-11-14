# AGENTS.md - Regeln für KI-Agenten

Dieses Dokument definiert die verbindlichen Regeln für alle KI-Agenten, die an diesem Projekt arbeiten.

## 1. Arbeitsweise
- **Analyse vor Aktion:** Bevor Dateien geändert oder Pakete installiert werden, muss der aktuelle Zustand des Projekts vollständig analysiert werden.
- **Minimalismus:** Keine unnötigen Abhängigkeiten hinzufügen. Code-Änderungen müssen begründet sein.
- **Konsistenz:** Bestehende Namenskonventionen, Dateistrukturen und Coding-Styles sind strikt einzuhalten.

## 2. Code-Qualität
- **TypeScript:** Alle neuen Komponenten und Logiken müssen in TypeScript verfasst sein. Typisierung sollte so präzise wie möglich sein.
- **Komponenten:** Erstellung von zentralen, wiederverwendbaren UI-Komponenten auf Basis von shadcn/ui.
- **Validierung:** Nach jeder Änderung muss eine TypeScript-Prüfung (`tsc`) und ein Build-Versuch durchgeführt werden, um die Integrität sicherzustellen.

## 3. Design-Treue
- Die Datei `docs/design/astra-dashboard-reference.png` ist die absolute Master-Referenz für das Desktop-Design.
- Keine eigenmächtigen Designänderungen oder "künstlerische Freiheit" bei der Desktop-Umsetzung.
- Mobile und Tablet-Ansichten müssen responsiv gestaltet werden und dabei die visuelle Identität bewahren.

## 4. Dokumentation
- Die fünf Kern-Dokumente (AGENTS.md, PROJECT.md, DESIGN.md, SECURITY.md, ROADMAP.md) müssen aktuell gehalten werden.
- Änderungen am Projektzustand sind in der ROADMAP.md zu dokumentieren.

## 5. Kommunikation
- Bei Unklarheiten bezüglich der Architektur oder des Designs ist vor der Implementierung nachzufragen.
- Jeder Auftrag endet mit einem vollständigen Bericht über Änderungen, Tests und offene Punkte.
