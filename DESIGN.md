# DESIGN.md - Designsystem und Referenzvorgaben

## Referenz
Die verbindliche visuelle Master-Referenz ist:
`docs/design/astra-dashboard-reference.png` (Abmessungen: 1536 x 864 Pixel)

## 1. Farbpalette & Visuelle Identität
Basierend auf der forensischen Analyse der Referenzdatei:

- **Hintergrund (Main):** `#060608`
- **Hintergrund (Sidebar):** `#0d0d10`
- **Karten-Hintergrund:** `#0d0d10` (leicht transparent/solid je nach Layer)
- **Astra Purple (Primary):** `#4b46c8`
- **Astra Cyan (Accent):** `#7de3ff`
- **Texte:** 
  - Primär: `#ffffff` (Weiß)
  - Sekundär/Muted: `#71717a` (Zink-500)
- **Status:**
  - Online: `#22c55e` (Grün)
  - Trend Up: `#22c55e`
  - Trend Down: `#ef4444`
- **Effekte:**
  - Markanter runder Glow oben rechts (Purple/Cyan Mischung).
  - Kartenrahmen: 1px solid `#1f1f23` (oder Zink-800/40).
  - Schatten: Subtiler "Astra Glow" hinter Primärelementen.

## 2. Layout-Spezifikationen (Desktop 1536px)
- **Sidebar-Breite:** 260px fix.
- **Topbar-Höhe:** 90px fix.
- **Main-Content-Padding:** 40px (links/rechts/oben).
- **Karten-Abstände (Gap):** 24px bis 32px (8 bis 10 Tailwind Einheiten).
- **Border-Radius:** 
  - Große Karten: `1.4rem` bis `1.5rem` (ca. 22–24px).
  - Kleine Elemente/Icons: `0.75rem` bis `1rem`.
- **Grid-Proportionen:**
  - Stats: 4 Spalten auf Desktop (`1fr 1fr 1fr 1fr`), gleich breit.
  - Hauptbereich unten: links/rechts ca. `70/30` (`minmax(0, 7fr)` / `minmax(360px, 3fr)`).
- **Rahmenlinien:** 1px, visuell zwischen `#252535` und `rgba(39,39,52,0.6)`.

## 3. Typografie
- **Font:** Moderne Sans-Serif (vorzugsweise Inter oder ähnlich dem Discord-Style).
- **Überschriften:**
  - Haupttitel ("Willkommen"): `text-[56px]`, font-black, `leading-[1.04]`.
  - Sektions-Titel: visuell ca. 24px (in Utility ggf. skaliert für Referenznähe), font-black.
- **Beschreibungen:** visuell ca. 20px, semibold, Farbe zwischen `#9ca3af` und `#a1a1aa`.
- **Statistik-Werte:** `text-4xl` (ca. 36px), font-black.

## 4. Komponenten-Details
- **Sidebar:** Icons (24px), Text (14px/Medium). "Übersicht" aktiv mit lila Background (Opacity 10%).
- **Stat-Cards:** Icon in Box (Zink-900/60), Titel (uppercase, tracking-widest).
- **Bot-Status:** Fortschrittsbalken (RAM) mit Glow-Effekt.
- **Aktivitätslog:** Einträge mit Hover-Effekt (Background-Change & Border-Glow).
- **Diagramm:** Area-Chart mit Datenpunkten, Grid-Lines (horizontal) und sanftem Gradient.

## 6. Zustände & Effekte (Desktop)
- **Active Nav:** lila Verlauf (`rgba(75,70,200,0.34 -> 0.14)`), leichter Outer-Glow.
- **Hover Cards:** Border-Aufhellung Richtung `astra-purple`/`astra-cyan`, kein starker Größen-Sprung.
- **Top-Right Glow:** Kombinierter Purple/Cyan-Glow mit kreisförmigen Arc-Anmutungen hinter dem Inhalt.
- **Chart:** sichtbare Linie + Punkte (weiß konturiert), violette Verlauf-Fläche, y-Grid gut lesbar, x-Tage (Di–Mo).

## 5. Responsive-Verhalten
- **Tablet (< 1024px):** Sidebar einklappbar, Stat-Cards 2-spaltig.
- **Mobile (< 768px):** Vollständiges Stacking, Sidebar via Hamburger-Menü, reduzierte Paddings.
