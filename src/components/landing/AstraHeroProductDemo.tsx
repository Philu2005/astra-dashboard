import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  BellRing,
  Clock3,
  CheckCircle2,
  CircleHelp,
  FileText,
  Gauge,
  MessageSquareText,
  ShieldCheck,
  SlidersHorizontal,
  Ticket,
  UserRound,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AstraLogo } from '@/components/AstraLogo';

const CONFIG_TIMELINE_DURATION_MS = 2200;
const CONFIG_TOGGLE_CLICK_PROGRESS = 0.6;
const HERO_SLIDE_HOLD_MS = 1200;

const SLIDE_DURATIONS: Record<number, number> = {
  0: 970 + 520 + HERO_SLIDE_HOLD_MS + 800,
  1: 700 + CONFIG_TIMELINE_DURATION_MS + HERO_SLIDE_HOLD_MS,
  2: 790 + 520 + HERO_SLIDE_HOLD_MS + 600,
  3: 700 + 520 + HERO_SLIDE_HOLD_MS + 600,
  4: 1740 + 520 + HERO_SLIDE_HOLD_MS,
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;
const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const linear = (t: number) => t;

const mapRange = (progress: number, start: number, end: number, easing: (value: number) => number = linear) => {
  if (progress <= start) {
    return 0;
  }
  if (progress >= end) {
    return 1;
  }

  return easing((progress - start) / (end - start));
};

const useReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return reducedMotion;
};

const useInView = (threshold = 0.35) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
};

const slideMeta = [
  'Willkommen',
  'Konfiguration',
  'Ticketsystem',
  'Moderation',
  'Community',
] as const;

const overviewModules = [
  { title: 'Tickets', value: '24 offen', state: 'SLA 98%' },
  { title: 'Automod', value: '6 Regeln', state: 'Aktiv' },
  { title: 'Modlog', value: '143 Logs', state: 'Live' },
  { title: 'Roles', value: '18 Sets', state: 'Sync' },
  { title: 'Levels', value: '214 aktiv', state: '+12%' },
] as const;

const configSections = [
  { name: 'Automod', status: 'Aktiv', accent: 'astra-hero-status-positive' },
  { name: 'Tickets', status: '2 Kategorien', accent: 'astra-hero-status-neutral' },
  { name: 'Rollen', status: '18 Rollen', accent: 'astra-hero-status-neutral' },
  { name: 'Logs', status: 'Protokolliert', accent: 'astra-hero-status-positive' },
] as const;

const moderationEvents = [
  { title: 'Automod-Regel ausgelöst', detail: 'Spam-Link entfernt' },
  { title: 'Warnung an User gesendet', detail: 'Stufe 2 · 5m Timeout' },
  { title: 'Modlog-Eintrag erstellt', detail: 'Audit-ID #A-2038' },
] as const;

const communityModules = [
  { title: 'Reaction Roles', value: '1.2k Vergaben' },
  { title: 'Joinroles', value: 'Auto-Rolle aktiv' },
  { title: 'Levelsystem', value: '89 XP/h' },
  { title: 'Events', value: '3 geplant' },
] as const;

export const AstraHeroProductDemo = ({ className }: { className?: string }) => {
  const reducedMotion = useReducedMotion();
  const { ref, isInView } = useInView();
  const configPanelRef = useRef<HTMLDivElement | null>(null);
  const configToggleRef = useRef<HTMLSpanElement | null>(null);
  const configTimelineFrameRef = useRef<number | undefined>(undefined);

  const [activeSlide, setActiveSlide] = useState(0);
  const [isConfigToggleEnabled, setIsConfigToggleEnabled] = useState(false);
  const [isCursorClicking, setIsCursorClicking] = useState(false);
  const isAnimationPaused = !isInView;

  useEffect(() => {
    if (isAnimationPaused || reducedMotion) {
      return;
    }

    const duration = SLIDE_DURATIONS[activeSlide] ?? 3500;
    const timeoutId = window.setTimeout(() => {
      setActiveSlide((prev) => (prev + 1) % slideMeta.length);
    }, duration);

    return () => window.clearTimeout(timeoutId);
  }, [activeSlide, isAnimationPaused, reducedMotion]);

  useEffect(() => {
    const panel = configPanelRef.current;
    const toggle = configToggleRef.current;

    const cleanupTimeline = () => {
      if (configTimelineFrameRef.current) {
        cancelAnimationFrame(configTimelineFrameRef.current);
        configTimelineFrameRef.current = undefined;
      }
    };

    const applyPointerState = (progress: number) => {
      if (!panel || !toggle) {
        return;
      }

      const panelRect = panel.getBoundingClientRect();
      const toggleRect = toggle.getBoundingClientRect();
      const targetX = toggleRect.left - panelRect.left + toggleRect.width / 2 - 2;
      const targetY = toggleRect.top - panelRect.top + toggleRect.height / 2 - 2;
      const startX = targetX - 80;
      const startY = targetY - 42;
      const leaveX = targetX + 62;
      const leaveY = targetY - 26;

      const enterPhase = mapRange(progress, 0.17, 0.25, easeOutQuint);
      const movePhase = mapRange(progress, 0.25, 0.56, easeInOutCubic);
      const clickDownPhase = mapRange(progress, 0.56, 0.62, easeInOutCubic);
      const clickUpPhase = mapRange(progress, 0.62, 0.68, easeOutQuint);
      const leavePhase = mapRange(progress, 0.72, 0.96, easeInOutCubic);

      const clickPress = clickDownPhase - clickUpPhase;

      let cursorX = lerp(startX, targetX, movePhase);
      let cursorY = lerp(startY, targetY, movePhase);
      let cursorScale = lerp(0.92, 1, movePhase);

      if (progress >= 0.56 && progress <= 0.68) {
        cursorY = targetY + clickPress * 2.9;
        cursorX = targetX + clickPress * 1.1;
        cursorScale = 1 - clickPress * 0.09;
      }

      if (progress > 0.72) {
        cursorX = lerp(targetX + 1, leaveX, leavePhase);
        cursorY = lerp(targetY + 1.5, leaveY, leavePhase);
        cursorScale = lerp(0.98, 0.88, leavePhase);
      }

      let cursorOpacity = 0;
      if (progress >= 0.17 && progress < 0.25) {
        cursorOpacity = enterPhase;
      } else if (progress >= 0.25 && progress < 0.9) {
        cursorOpacity = 1;
      } else if (progress >= 0.9) {
        cursorOpacity = 1 - mapRange(progress, 0.9, 1, easeInOutCubic);
      }

      panel.style.setProperty('--astra-pointer-x', `${cursorX.toFixed(2)}px`);
      panel.style.setProperty('--astra-pointer-y', `${cursorY.toFixed(2)}px`);
      panel.style.setProperty('--astra-pointer-opacity', `${cursorOpacity.toFixed(3)}`);
      panel.style.setProperty('--astra-pointer-scale', `${cursorScale.toFixed(3)}`);
    };

    const shouldRunTimeline = activeSlide === 1 && !isAnimationPaused && !reducedMotion;
    if (!shouldRunTimeline || !panel || !toggle) {
      cleanupTimeline();
      setIsConfigToggleEnabled(false);
      applyPointerState(0);
      return;
    }

    cleanupTimeline();
    setIsConfigToggleEnabled(false);
    applyPointerState(0);

    let startedAt = 0;
    let hasToggled = false;
    let clickResetTimer: number | undefined;

    const tick = (timestamp: number) => {
      if (startedAt === 0) {
        startedAt = timestamp;
      }

      const progress = clamp01((timestamp - startedAt) / CONFIG_TIMELINE_DURATION_MS);
      applyPointerState(progress);

      if (progress >= CONFIG_TOGGLE_CLICK_PROGRESS && !hasToggled) {
        hasToggled = true;
        setIsConfigToggleEnabled(true);
        setIsCursorClicking(true);
        clickResetTimer = window.setTimeout(() => setIsCursorClicking(false), 420);
      }

      if (progress < 1) {
        configTimelineFrameRef.current = requestAnimationFrame(tick);
      }
    };

    configTimelineFrameRef.current = requestAnimationFrame(tick);

    return () => {
      cleanupTimeline();
      if (clickResetTimer) {
        window.clearTimeout(clickResetTimer);
      }
    };
  }, [activeSlide, isAnimationPaused, reducedMotion]);

  return (
    <div
      ref={ref}
      className={cn(
        'relative mx-auto h-auto w-full max-w-[500px] overflow-hidden rounded-[1.45rem] border border-[#2c3248] bg-[linear-gradient(180deg,#141728_0%,#0f1222_100%)] p-3 shadow-[0_0_0_1px_rgba(125,227,255,0.12),0_28px_72px_-50px_rgba(97,87,246,0.88)] sm:p-3.5',
        className,
      )}
      aria-label="Astra Produktdemo"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(181,111,255,0.2)_0%,rgba(181,111,255,0)_45%),radial-gradient(circle_at_84%_22%,rgba(125,227,255,0.2)_0%,rgba(125,227,255,0)_43%)]" />
      <div
        className={cn('relative aspect-[10/7] min-h-[292px] w-full sm:min-h-[306px]', isAnimationPaused && 'astra-hero-paused')}
        data-reduced-motion={reducedMotion}
      >
        <div className={cn('astra-hero-scene astra-hero-scene-1 motion-reduce:opacity-100', activeSlide === 0 && 'astra-hero-scene-active')}>
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.14em] text-[#aab2cf]">Willkommen bei Astra</p>
            <span className="astra-hero-chip astra-hero-status-positive">Live Demo</span>
          </div>
          <div className="rounded-xl p-2.5 astra-hero-card astra-hero-card-vivid astra-hero-element astra-hero-step-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center w-10 h-10 bg-[#4b46c8] rounded-xl shadow-astra-glow overflow-hidden shrink-0">
                  <AstraLogo size={40} glow="ultra" fill className="scale-[1.18]" />
                </div>
                <div>
                  <p className="text-[0.78rem] font-semibold text-white">Astra Systemzentrale</p>
                  <p className="text-[0.67rem] text-[#aab2cf]">Discord Management in einem Flow</p>
                </div>
              </div>
              <span className="astra-hero-chip astra-hero-status-positive">Online</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5 text-[0.64rem]">
              <div className="astra-hero-stat-cell astra-hero-inner-panel px-2 py-1.5">
                <p className="text-[#aab2cf]">Antwortzeit</p>
                <p className="mt-0.5 text-[0.72rem] font-semibold text-[#e8eeff]">92 ms</p>
              </div>
              <div className="astra-hero-stat-cell astra-hero-inner-panel px-2 py-1.5">
                <p className="text-[#aab2cf]">Auto-Aktionen</p>
                <p className="mt-0.5 text-[0.72rem] font-semibold text-[#e8eeff]">381 / d</p>
              </div>
              <div className="astra-hero-stat-cell astra-hero-inner-panel px-2 py-1.5">
                <p className="text-[#aab2cf]">Health</p>
                <p className="mt-0.5 text-[0.72rem] font-semibold text-[#8ee7ff]">99.9%</p>
              </div>
            </div>
          </div>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {overviewModules.slice(0, 3).map((item, index) => (
              <div
                key={item.title}
                className={cn(
                  'rounded-lg px-2 py-1.5 astra-hero-card astra-hero-card-soft astra-hero-element',
                  `astra-hero-step-${index + 2}`,
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <p className="text-[0.67rem] font-medium text-[#d7def7]">{item.title}</p>
                  <span className="astra-hero-chip astra-hero-status-neutral">{item.state}</span>
                </div>
                <p className="mt-0.5 text-[0.62rem] text-[#aab2cf]">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            {overviewModules.slice(3).map((item, index) => (
              <div
                key={item.title}
                className={cn(
                  'rounded-lg px-2 py-1.5 astra-hero-card astra-hero-card-soft astra-hero-element',
                  `astra-hero-step-${index + 5}`,
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <p className="text-[0.67rem] font-medium text-[#d7def7]">{item.title}</p>
                  <span className="astra-hero-chip astra-hero-status-neutral">{item.state}</span>
                </div>
                <p className="mt-0.5 text-[0.62rem] text-[#aab2cf]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={cn('astra-hero-scene astra-hero-scene-2', activeSlide === 1 && 'astra-hero-scene-active')}>
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.14em] text-[#aab2cf]">Konfiguration</p>
            <span className="astra-hero-chip astra-hero-status-neutral">Strukturiert</span>
          </div>
          <div className="grid grid-cols-[0.9fr_1.3fr] gap-2">
            <div className="rounded-lg p-2.5 text-[0.7rem] text-[#aab2cf] astra-hero-card astra-hero-card-soft astra-hero-element astra-hero-step-1">
              <p className="mb-1.5 text-[0.72rem] font-semibold text-[#e3e9ff]">Bereiche</p>
              <div className="space-y-1.5">
                {configSections.map((item) => (
                  <div key={item.name} className="flex items-center justify-between astra-hero-inner-panel px-2 py-1.5">
                    <span>{item.name}</span>
                    <span className={cn('astra-hero-chip', item.accent)}>{item.status}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 rounded-md border border-[rgba(88,190,164,0.3)] bg-[linear-gradient(135deg,rgba(20,56,60,0.6)_0%,rgba(16,46,50,0.5)_100%)] px-2 py-1.5 text-[0.65rem] text-[#8ee7ff]">
                4 Änderungen bereit zur Übernahme
              </div>
            </div>
            <div
              ref={configPanelRef}
              className="astra-hero-config-panel rounded-lg p-2.5 astra-hero-card astra-hero-card-vivid astra-hero-element astra-hero-step-2"
            >
              <p className="text-[0.76rem] font-semibold text-white inline-flex items-center gap-1.5">
                <div className="relative flex items-center justify-center w-8 h-8 bg-[#4b46c8] rounded-lg shadow-astra-glow overflow-hidden shrink-0">
                  <AstraLogo size={32} glow="ultra" fill className="scale-[1.18]" />
                </div>
                Konfiguration
              </p>
              <div className="mt-2 space-y-1.5 text-[0.7rem] text-[#c8d2f5]">
                <div className="flex items-center justify-between astra-hero-inner-panel px-2 py-1.5 astra-hero-card-row">
                  <div className="flex items-center gap-1.5">
                    <span>Automod aktiv</span>
                    <span className={cn('astra-hero-chip', isConfigToggleEnabled ? 'astra-hero-status-positive' : 'astra-hero-status-neutral')}>
                      {isConfigToggleEnabled ? 'EIN' : 'AUS'}
                    </span>
                  </div>
                  <span
                    ref={configToggleRef}
                    className={cn('relative inline-flex h-[1.05rem] w-9 items-center rounded-full p-[2px] astra-hero-toggle-track', isConfigToggleEnabled && 'astra-hero-toggle-track-on')}
                    aria-hidden="true"
                  >
                    <span className={cn('block h-3.5 w-3.5 rounded-full bg-[#7de3ff] astra-hero-toggle', isConfigToggleEnabled && 'astra-hero-toggle-on')} />
                  </span>
                </div>
                <div className="flex items-center justify-between astra-hero-inner-panel px-2 py-1.5 astra-hero-card-row">
                  <span>Ticket-Kategorie</span>
                  <span className="text-[#8ee7ff]">Support ▾</span>
                </div>
                <div className="flex items-center justify-between astra-hero-inner-panel px-2 py-1.5 astra-hero-card-row">
                  <span>Logging-Channel</span>
                  <span className="text-[#8ee7ff]">#modlog</span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <div className="inline-flex items-center gap-1 rounded-full border border-[rgba(88,190,164,0.3)] bg-[linear-gradient(135deg,rgba(20,56,60,0.6)_0%,rgba(16,46,50,0.5)_100%)] px-2 py-1 text-[0.65rem] text-[#8ee7ff] astra-hero-element astra-hero-step-3">
                  <CheckCircle2 className="h-3 w-3" />
                  Gespeichert
                </div>
                <div className="inline-flex items-center gap-1 astra-hero-inner-panel px-2 py-1 text-[0.65rem] text-[#c6cfec] astra-hero-element astra-hero-step-4">
                  <CircleHelp className="h-3 w-3 text-[#8ee7ff]" />
                  Hilfe verfügbar
                </div>
              </div>
              <div className="astra-hero-pointer" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="astra-cursor-grad" x1="0" y1="0" x2="18" y2="20" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#b89bff" />
                      <stop offset="50%" stopColor="#7de3ff" />
                      <stop offset="100%" stopColor="#9d94ff" />
                    </linearGradient>
                  </defs>
                  <path d="M3 2l12 8.5-5.2 1.2L7 17.5 3 2z" fill="url(#astra-cursor-grad)" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinejoin="round" />
                </svg>
                <div className={cn('astra-hero-cursor-click-ring', isCursorClicking && 'astra-hero-cursor-clicking')} />
              </div>
              <div className="astra-hero-cursor-ring" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className={cn('astra-hero-scene astra-hero-scene-3', activeSlide === 2 && 'astra-hero-scene-active')}>
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.14em] text-[#aab2cf]">Ticketsystem</p>
            <span className="astra-hero-chip astra-hero-status-neutral">Übersichtlich</span>
          </div>
          <div className="rounded-xl p-2.5 astra-hero-card astra-hero-card-vivid astra-hero-element astra-hero-step-1">
            <div className="flex items-center justify-between">
              <p className="text-[0.76rem] text-white inline-flex items-center gap-1.5">
                <div className="relative flex items-center justify-center w-8 h-8 bg-[#4b46c8] rounded-lg shadow-astra-glow overflow-hidden shrink-0">
                  <AstraLogo size={32} glow="ultra" fill className="scale-[1.18]" />
                </div>
                Ticket #2841
              </p>
              <span className="astra-hero-chip" style={{ borderColor: 'rgba(173,140,255,0.4)', background: 'linear-gradient(135deg, rgba(34,24,58,0.9) 0%, rgba(28,20,50,0.85) 100%)', color: '#d4b8ff' }}>Neu</span>
            </div>
            <p className="mt-2 astra-hero-inner-panel px-2 py-1.5 text-[0.7rem] text-[#bdd3ff]">"Ich brauche Hilfe bei Rollenrechten"</p>
            <div className="mt-2 grid grid-cols-3 gap-1.5 text-[0.64rem]">
              <div className="astra-hero-stat-cell astra-hero-inner-panel px-2 py-1">
                <p className="text-[#aab2cf]">Erstellt</p>
                <p className="text-[#e2e9ff]">19:42</p>
              </div>
              <div className="astra-hero-stat-cell astra-hero-inner-panel px-2 py-1">
                <p className="text-[#aab2cf]">Priorität</p>
                <p className="text-[#ffd7a3]">Normal</p>
              </div>
              <div className="astra-hero-stat-cell astra-hero-inner-panel px-2 py-1">
                <p className="text-[#aab2cf]">Bearbeiter</p>
                <p className="text-[#e2e9ff]">Team-2</p>
              </div>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <div className="rounded-lg p-2 astra-hero-card astra-hero-card-soft astra-hero-element astra-hero-step-2">
              <p className="text-[0.64rem] text-[#aab2cf]">Status</p>
              <p className="mt-0.5 text-[0.72rem] text-[#d7def7] inline-flex items-center gap-1">
                <MessageSquareText className="h-3 w-3 text-[#ad8cff]" />
                In Bearbeitung
              </p>
            </div>
            <div className="rounded-lg p-2 astra-hero-card astra-hero-card-soft astra-hero-element astra-hero-step-3">
              <p className="text-[0.64rem] text-[#aab2cf]">Antwortzeit</p>
              <p className="mt-0.5 text-[0.72rem] text-[#d7def7] inline-flex items-center gap-1">
                <Clock3 className="h-3 w-3 text-[#8ee7ff]" />
                2m 14s
              </p>
            </div>
          </div>
        </div>

        <div className={cn('astra-hero-scene astra-hero-scene-4', activeSlide === 3 && 'astra-hero-scene-active')}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[0.75rem] font-medium uppercase tracking-[0.14em] text-[#a4acd1]">Moderation & Übersicht</p>
            <span className="rounded-full border border-[#4a4f80] bg-[linear-gradient(135deg,#1a1f3d_0%,#151a33_100%)] px-2.5 py-1 text-[0.68rem] text-[#cad2f0] shadow-[0_2px_8px_-4px_rgba(75,70,200,0.3)]">Kontrolle</span>
          </div>
          <div className="grid grid-cols-[1.25fr_0.95fr] gap-2">
            <div className="space-y-1.5">
              {moderationEvents.map((item, index) => (
                <div
                  key={item.title}
                  className={cn(
                    'rounded-md border border-[#323b5f] bg-[#121933] px-2.5 py-2 astra-hero-card astra-hero-card-soft astra-hero-element',
                    `astra-hero-step-${index + 1}`,
                  )}
                >
                  <p className="text-[0.72rem] text-[#cbd4f3]">{item.title}</p>
                  <p className="mt-0.5 text-[0.66rem] text-[#97a9d9]">{item.detail}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-[#33416a] bg-[#151d38] p-2.5 text-[0.72rem] text-[#cfd7f6] astra-hero-card astra-hero-card-vivid astra-hero-element astra-hero-step-2">
              <p className="mb-1 inline-flex items-center gap-1 text-white">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#9d94ff]" />
                Regeln
              </p>
              <p className="rounded-md border border-[#36456f] bg-[#0f1931] px-2 py-1.5 inline-flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-[#9ef7dd]" />
                Spam-Filter aktiviert
              </p>
              <p className="mt-2 rounded-md border border-[#36456f] bg-[#0f1931] px-2 py-1.5 inline-flex items-center gap-1">
                <FileText className="h-3 w-3 text-[#7de3ff]" />
                Aktivität protokolliert
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1.5 text-[0.65rem]">
                <div className="astra-hero-stat-cell rounded-md border border-[#36456f] bg-[linear-gradient(135deg,#111932_0%,#0f1730_100%)] px-1.5 py-1">
                  <p className="text-[#97a9d7]">Heute</p>
                  <p className="text-[#e0e8ff]">47 Hits</p>
                </div>
                <div className="astra-hero-stat-cell rounded-md border border-[#36456f] bg-[linear-gradient(135deg,#111932_0%,#0f1730_100%)] px-1.5 py-1">
                  <p className="text-[#97a9d7]">False Pos.</p>
                  <p className="text-[#e0e8ff]">1.3%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={cn('astra-hero-scene astra-hero-scene-5', activeSlide === 4 && 'astra-hero-scene-active')}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[0.75rem] font-medium uppercase tracking-[0.14em] text-[#a4acd1]">Community & Interaktion</p>
            <span className="rounded-full border border-[#4a4f80] bg-[linear-gradient(135deg,#1a1f3d_0%,#151a33_100%)] px-2.5 py-1 text-[0.68rem] text-[#cad2f0] shadow-[0_2px_8px_-4px_rgba(75,70,200,0.3)]">Engagement</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {communityModules.map((item, index) => (
              <div
                key={item.title}
                className={cn(
                  'rounded-lg border border-[#33406a] bg-[#141c37] p-2.5 astra-hero-card astra-hero-card-soft astra-hero-element',
                  `astra-hero-step-${index + 1}`,
                )}
              >
                <p className="text-[0.72rem] text-[#d7def7]">{item.title}</p>
                <p className="mt-1 text-[0.66rem] text-[#97a9d9]">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {[0, 1, 2, 3].map((avatar) => (
                <div key={avatar} className="flex h-6 w-6 items-center justify-center rounded-full border border-[#4a537d] bg-[#1a2240] text-[#b6c0e6]">
                  <UserRound className="h-3.5 w-3.5" />
                </div>
              ))}
            </div>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#1c2748]">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,#4b46c8_0%,#7de3ff_100%)] astra-hero-level-progress" />
            </div>
            <span className="text-[0.68rem] text-[#b9c4ea] inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              +214
            </span>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5 text-[0.64rem] astra-hero-element astra-hero-step-5">
            <div className="rounded-md border border-[#33406a] bg-[#111933] px-1.5 py-1 text-[#9bb0df] inline-flex items-center gap-1">
              <Activity className="h-3 w-3 text-astra-cyan" />
              Aktiv
            </div>
            <div className="rounded-md border border-[#33406a] bg-[#111933] px-1.5 py-1 text-[#9bb0df] inline-flex items-center gap-1">
              <BellRing className="h-3 w-3 text-[#b89bff]" />
              Alerts
            </div>
            <div className="rounded-md border border-[#33406a] bg-[#111933] px-1.5 py-1 text-[#9bb0df] inline-flex items-center gap-1">
              <Gauge className="h-3 w-3 text-[#9ef7dd]" />
              Stable
            </div>
            <div className="rounded-md border border-[#33406a] bg-[#111933] px-1.5 py-1 text-[#9bb0df] inline-flex items-center gap-1">
              <BarChart3 className="h-3 w-3 text-astra-cyan" />
              Growth
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-30 mt-3 flex items-center justify-center gap-2.5">
        {slideMeta.map((item, index) => (
          <button
            key={item}
            type="button"
            className={cn('astra-hero-indicator', activeSlide === index && 'astra-hero-indicator-active')}
            aria-label={`Slide ${index + 1}: ${item}`}
            aria-current={activeSlide === index ? 'true' : undefined}
            onClick={() => setActiveSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};
