import { useEffect, useRef, useState, useCallback } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Globe,
  LayoutDashboard,
  Bot,
  Database,
  Server,
  MessageSquare,
  RefreshCw,
  Clock,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SharedNavbar } from '@/components/SharedNavbar';
import { AstraLogo } from '@/components/AstraLogo';
import { statusApi, type StatusPageData, type ServiceStatus, type Incident, type DayHistory } from '@/services/status-api';
import { getReturnToFromUrl } from '@/lib/returnTo';

// ─── Konstanten ──────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  operational: '#22c55e',
  degraded: '#eab308',
  outage: '#ef4444',
  unknown: '#6b7280',
};

const STATUS_BG: Record<string, string> = {
  operational: 'bg-emerald-500/10 border-emerald-500/20',
  degraded: 'bg-yellow-500/10 border-yellow-500/20',
  outage: 'bg-red-500/10 border-red-500/20',
  unknown: 'bg-gray-500/10 border-gray-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  operational: 'Betriebsbereit',
  degraded: 'Beeinträchtigt',
  outage: 'Ausfall',
  unknown: 'Unbekannt',
};

const OVERALL_ICONS: Record<string, typeof CheckCircle2> = {
  operational: CheckCircle2,
  degraded: AlertTriangle,
  outage: XCircle,
  unknown: HelpCircle,
};

const SERVICE_ICONS: Record<string, typeof Globe> = {
  'Website': Globe,
  'Landing Page': Globe,
  'Dashboard': LayoutDashboard,
  'Astra API': Server,
  'Astra Bot': Bot,
  'MySQL': Database,
  'Discord': MessageSquare,
};

const INCIDENT_STATUS_LABELS: Record<string, string> = {
  investigating: 'Wird untersucht',
  identified: 'Identifiziert',
  monitoring: 'Wird überwacht',
  resolved: 'Behoben',
};

const POLL_INTERVAL = 60_000;

// ─── Hilfsfunktionen ─────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '–';
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'gerade eben';
  if (mins < 60) return `vor ${mins} Min.`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
}

// ─── Komponenten ─────────────────────────────────────────────

function StatusBarTooltip({ day, label }: { day: DayHistory; label: string }) {
  return (
    <div className="whitespace-nowrap rounded-lg border border-[#2a2f4a] bg-[#161929] px-3 py-2 text-xs shadow-xl">
      <p className="font-medium text-white">{label}</p>
      <p className="text-[#a6adca]">{STATUS_LABELS[day.status] || 'Unbekannt'}</p>
      {day.status !== 'unknown' && <p className="text-[#a6adca]">{day.uptime_percent}% Verfügbarkeit</p>}
    </div>
  );
}

function StatusBar({ 
  day, 
  selected, 
  onSelect, 
  mode,
  isFirst,
  isLast
}: { 
  day: DayHistory; 
  selected?: boolean; 
  onSelect?: () => void; 
  mode?: 'desktop' | 'mobile';
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const color = STATUS_COLORS[day.status] || STATUS_COLORS.unknown;

  const isDesktop = mode === 'desktop';
  const isMobile = mode === 'mobile';
  const active = isDesktop ? (hover || selected) : selected;

  return (
    <div
      className="status-bar relative flex-1 min-w-0"
      onMouseEnter={isDesktop ? () => setHover(true) : undefined}
      onMouseLeave={isDesktop ? () => setHover(false) : undefined}
      onClick={isMobile ? onSelect : undefined}
      role={isMobile ? 'button' : undefined}
      tabIndex={isMobile ? 0 : undefined}
      onKeyDown={isMobile ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(); } } : undefined}
    >
      <div
        className="cursor-pointer"
        style={{
          height: '34px',
          backgroundColor: color,
          opacity: active ? 1 : 0.85,
          transform: active ? 'translateY(-3px)' : 'translateY(0)',
          filter: active ? 'brightness(1.25)' : 'brightness(1)',
          transition: 'all 100ms cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: isFirst ? '4px 0 0 4px' : isLast ? '0 4px 4px 0' : '0',
        }}
      />
    </div>
  );
}

function MobileHistoryScroll({ dailyHistory }: { dailyHistory: DayHistory[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const initializedRef = useRef(false);

  const updateProgress = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) { setScrollProgress(1); return; }
    setScrollProgress(el.scrollLeft / maxScroll);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || initializedRef.current) return;
    if (el.scrollWidth > el.clientWidth) {
      el.scrollLeft = el.scrollWidth - el.clientWidth;
      initializedRef.current = true;
      updateProgress();
    }
  }, [dailyHistory, updateProgress]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => updateProgress();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [updateProgress]);

  // Tap-outside schließt Tooltip
  useEffect(() => {
    if (selectedIndex === null) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSelectedIndex(null);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [selectedIndex]);

  const showLeftFade = scrollProgress > 0.02;
  const showRightFade = scrollProgress < 0.98;

  // Tooltip-Position berechnen
  const getTooltipStyle = (): { container: React.CSSProperties; arrowLeft: number } => {
    if (selectedIndex === null || !scrollRef.current) return { container: { display: 'none' }, arrowLeft: 0 };
    const barWidth = 6;
    const gap = 3;
    const barCenter = selectedIndex * (barWidth + gap) + barWidth / 2;
    const scrollLeft = scrollRef.current.scrollLeft;
    const containerWidth = scrollRef.current.clientWidth;
    const visiblePos = barCenter - scrollLeft;
    const tooltipW = 140;
    let left = visiblePos - tooltipW / 2;
    left = Math.max(4, Math.min(left, containerWidth - tooltipW - 4));
    const arrowLeft = visiblePos - left;
    return {
      container: {
        position: 'absolute' as const,
        bottom: '100%',
        left: `${left}px`,
        marginBottom: '10px',
        zIndex: 50,
        width: `${tooltipW}px`,
      },
      arrowLeft,
    };
  };

  const selectedDay = selectedIndex !== null ? dailyHistory[selectedIndex] : null;
  const selectedLabel = selectedDay
    ? new Date(selectedDay.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : '';

  return (
    <div ref={containerRef} className="md:hidden w-full min-w-0">
      {/* Scroll-Container mit Fade-Overlays */}
      <div className="relative">
        {/* Mobile Tooltip */}
        {selectedDay && (() => {
          const { container, arrowLeft } = getTooltipStyle();
          return (
            <div style={container}>
              <StatusBarTooltip day={selectedDay} label={selectedLabel} />
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: `${arrowLeft}px`,
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: '5px solid #2a2f4a',
                }}
              />
            </div>
          );
        })()}
        <div
          ref={scrollRef}
          className="w-full overflow-x-auto scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div
            style={{
              display: 'flex',
              gap: '3px',
              width: `${dailyHistory.length * 6 + (dailyHistory.length - 1) * 3}px`,
            }}
          >
            {dailyHistory.map((day, i) => (
              <div key={day.date} style={{ width: '6px', flexShrink: 0, borderRadius: '2px', overflow: 'hidden' }}>
                <StatusBar
                  day={day}
                  mode="mobile"
                  selected={selectedIndex === i}
                  onSelect={() => setSelectedIndex(selectedIndex === i ? null : i)}
                />
              </div>
            ))}
          </div>
        </div>
        {/* Fade links */}
        <div
          className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none transition-opacity duration-200"
          style={{
            opacity: showLeftFade ? 1 : 0,
            background: 'linear-gradient(to right, rgba(18,21,42,0.9), transparent)',
          }}
        />
        {/* Fade rechts */}
        <div
          className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none transition-opacity duration-200"
          style={{
            opacity: showRightFade ? 1 : 0,
            background: 'linear-gradient(to left, rgba(18,21,42,0.9), transparent)',
          }}
        />
      </div>
      {/* Navigation unterhalb: Labels + Fortschrittsindikator */}
      <div className="flex items-center gap-2 mt-1.5 px-0.5">
        <span className="text-[0.6rem] text-[#5a6180] whitespace-nowrap shrink-0">vor 90 Tagen</span>
        <div className="flex-1 h-[3px] rounded-full bg-[#1a1e38] relative overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-[#7de3ff]/40 transition-all duration-150"
            style={{
              width: '30%',
              left: `${scrollProgress * 70}%`,
            }}
          />
        </div>
        <span className="text-[0.6rem] text-[#7de3ff] font-medium whitespace-nowrap shrink-0">Heute</span>
      </div>
    </div>
  );
}

function DesktopHistory({ dailyHistory }: { dailyHistory: DayHistory[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isInContainer, setIsInContainer] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ left: number; arrowLeft: number; bottom: number } | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateTooltipPos = useCallback((index: number) => {
    const grid = gridRef.current;
    const container = containerRef.current;
    if (!grid || !container) return;
    const bars = grid.children;
    if (index < 0 || index >= bars.length) return;
    const bar = bars[index] as HTMLElement;
    const barRect = bar.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;

    // Wir messen den Tooltip falls er schon da ist, sonst Fallback 140
    let tooltipW = 140;
    if (tooltipRef.current) {
      tooltipW = tooltipRef.current.getBoundingClientRect().width;
    }

    const barCenter = barRect.left - containerRect.left + barRect.width / 2;
    
    // Tooltip positionieren, aber innerhalb des Containers (oder Card-Viewports) halten
    // Wir erlauben dem Tooltip leicht über den Container zu ragen, 
    // solange er innerhalb der ServiceCard (overflow-visible) bleibt.
    // Aber wir begrenzen ihn gegen die Bildschirmränder.
    const viewportWidth = window.innerWidth;
    const barGlobalCenter = barRect.left + barRect.width / 2;
    
    let left = barCenter;
    const halfW = tooltipW / 2;
    
    // Prüfung gegen Viewport-Grenzen (global)
    const minGlobal = halfW + 10;
    const maxGlobal = viewportWidth - halfW - 10;
    
    if (barGlobalCenter < minGlobal) {
      // Tooltip muss nach rechts geschoben werden
      const shift = minGlobal - barGlobalCenter;
      left += shift;
    } else if (barGlobalCenter > maxGlobal) {
      // Tooltip muss nach links geschoben werden
      const shift = barGlobalCenter - maxGlobal;
      left -= shift;
    }

    // Pfeil zeigt IMMER auf die Bar-Mitte relativ zur Tooltip-Linken-Kante
    const arrowLeft = barCenter - left;

    setTooltipPos({
      left,
      arrowLeft,
      bottom: containerRect.bottom - barRect.top + 14,
    });
  }, []);

  // Effekt um Tooltip-Position bei Breitenänderung nachzujustieren (falls offen)
  useEffect(() => {
    if (hoverIndex !== null) {
      updateTooltipPos(hoverIndex);
    }
  }, [hoverIndex, updateTooltipPos]);

  const handleBarEnter = useCallback((index: number) => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setHoverIndex(index);
    setIsInContainer(true);
    updateTooltipPos(index);
  }, [updateTooltipPos]);

  const handleContainerLeave = useCallback(() => {
    leaveTimerRef.current = setTimeout(() => {
      setHoverIndex(null);
      setIsInContainer(false);
      setTooltipPos(null);
    }, 30);
  }, []);

  const handleContainerEnter = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  const hoveredDay = hoverIndex !== null ? dailyHistory[hoverIndex] : null;
  const hoveredLabel = hoveredDay
    ? new Date(hoveredDay.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : '';

  const showTooltip = isInContainer && hoveredDay && tooltipPos;

  return (
    <div
      ref={containerRef}
      className="w-full hidden md:block relative"
      style={{ overflow: 'visible' }}
      onMouseEnter={handleContainerEnter}
      onMouseLeave={handleContainerLeave}
    >
      {/* Tooltip rendered outside overflow:hidden container */}
      <div
        ref={tooltipRef}
        className="absolute z-50 pointer-events-none"
        style={{
          left: tooltipPos ? `${tooltipPos.left}px` : 0,
          bottom: tooltipPos ? `${tooltipPos.bottom}px` : 0,
          transform: 'translateX(-50%)',
          opacity: showTooltip ? 1 : 0,
          transition: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {hoveredDay && (
          <div className="relative">
            <StatusBarTooltip day={hoveredDay} label={hoveredLabel} />
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                marginLeft: tooltipPos ? `${tooltipPos.arrowLeft}px` : 0,
                transform: 'translateX(-50%) rotate(45deg)',
                marginTop: '-6px',
                width: '12px',
                height: '12px',
                backgroundColor: '#161929',
                borderRight: '1px solid #2a2f4a',
                borderBottom: '1px solid #2a2f4a',
                zIndex: -1,
              }}
            />
          </div>
        )}
      </div>
      <div
        ref={gridRef}
        className="status-history-grid w-full flex"
        style={{
          gap: '3px',
          overflow: 'visible',
        }}
      >
        {dailyHistory.map((day, i) => (
          <div
            key={day.date}
            className="flex-1 min-w-0"
            onMouseEnter={() => handleBarEnter(i)}
          >
            <StatusBar 
              day={day} 
              mode="desktop" 
              selected={hoverIndex === i} 
              isFirst={i === 0}
              isLast={i === dailyHistory.length - 1}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ServiceCard({ service }: { service: ServiceStatus }) {
  const Icon = SERVICE_ICONS[service.name] || Activity;
  const statusColor = STATUS_COLORS[service.current_status] || STATUS_COLORS.unknown;
  const statusLabel = STATUS_LABELS[service.current_status] || 'Unbekannt';

  return (
    <div className="rounded-xl border border-[#1e2240] bg-[#12152a]/80 p-5 transition-all hover:border-[#2a2f4a] min-w-0 overflow-visible">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap md:flex-nowrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
            style={{ backgroundColor: `${statusColor}15`, border: `1px solid ${statusColor}25` }}
          >
            <Icon className="h-5 w-5" style={{ color: statusColor }} />
          </div>
          <div className="min-w-0">
            {/* Auf kleinen Screens umbrechen, auf Desktop wie zuvor ggf. truncaten */}
            <h3 className="text-[0.95rem] font-semibold text-white leading-tight break-words md:truncate">{service.name}</h3>
            <p className="text-xs text-[#7a82a6] mt-0.5 break-words md:truncate">{service.description}</p>
          </div>
        </div>
        {/* Rechts: Kennzahlen auf XS unter den Titel umbrechen */}
        <div className="flex flex-col gap-1.5 items-start md:items-end w-full md:w-auto mt-2 md:mt-0">
          <span className="text-sm font-semibold text-[#a6adca]">
            {service.uptime_percent > 0 ? `${service.uptime_percent}%` : '–'}
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border"
            style={{
              color: statusColor,
              borderColor: `${statusColor}30`,
              backgroundColor: `${statusColor}10`,
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Sub-Status bei Website */}
      {service.sub_status && (
        <p className="text-xs text-yellow-400/80 mt-1 mb-3">{service.sub_status}</p>
      )}

      {/* Historische Balken – Desktop: Grid, Mobile: feste Balken mit Scroll */}
      {/* Desktop */}
      <DesktopHistory dailyHistory={service.daily_history} />
      {/* Mobile */}
      <MobileHistoryScroll dailyHistory={service.daily_history} />

      {/* Zeitachse – nur Desktop, Mobile hat eigene Navigation in MobileHistoryScroll */}
      <div className="hidden md:flex items-center justify-between mt-2 text-[0.7rem] text-[#5a6180]">
        <span>vor 90 Tagen</span>
        <span>heute</span>
      </div>

      {/* Footer */}
      {service.last_check && (
        <div className="mt-2 flex items-center justify-between text-[0.7rem] text-[#5a6180]">
          <span>Letzte Prüfung: {timeAgo(service.last_check)}</span>
          {service.response_time_ms != null && service.response_time_ms > 0 && (
            <span>{Math.round(service.response_time_ms)} ms</span>
          )}
        </div>
      )}
    </div>
  );
}

function IncidentCard({ incident }: { incident: Incident }) {
  const isResolved = incident.status === 'resolved';
  const statusLabel = INCIDENT_STATUS_LABELS[incident.status] || incident.status;

  return (
    <div className={cn(
      'rounded-xl border p-4 transition-all',
      isResolved
        ? 'border-[#1e2240] bg-[#12152a]/60'
        : 'border-[#2a2040] bg-[#1a1530]/60',
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-[#a6adca] bg-[#1a1e38] border border-[#252a45] rounded-md px-2 py-0.5">
              {incident.service_name}
            </span>
            <span className={cn(
              'text-xs font-medium rounded-md px-2 py-0.5 border',
              isResolved
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
            )}>
              {statusLabel}
            </span>
          </div>
          <p className="text-sm text-[#d1d7ef] font-medium break-words">{incident.title}</p>
          <p className="text-xs text-[#7a82a6] mt-1 break-words">{incident.description}</p>
        </div>
        <div className="text-right text-xs text-[#5a6180] whitespace-nowrap shrink-0">
          <p>{formatDate(incident.started_at)}</p>
          {incident.resolved_at && (
            <p className="text-emerald-500/70 mt-0.5">Behoben: {formatDate(incident.resolved_at)}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Hauptkomponente ─────────────────────────────────────────

export default function StatusPage() {
  const [data, setData] = useState<StatusPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const backTo = getReturnToFromUrl(undefined, '/');

  const fetchData = useCallback(async () => {
    try {
      const result = await statusApi.getStatusPage();
      setData(result);
      setError(null);
    } catch (e) {
      setError('Statusdaten konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const overallStatus = data?.overall?.status || 'unknown';
  const overallLabel = data?.overall?.label || 'Status wird geladen...';
  const OverallIcon = OVERALL_ICONS[overallStatus] || HelpCircle;
  const overallColor = STATUS_COLORS[overallStatus] || STATUS_COLORS.unknown;

  return (
    <div className="min-h-screen bg-[#0b0e1a] text-white">
      <SharedNavbar
        variant="subpage"
        activeRoute="/status"
        showBackButton
        backTo={backTo}
        customLeftContent={
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-[#7de3ff]" />
            <span className="text-[0.95rem] font-bold tracking-tight text-white">Systemstatus</span>
          </div>
        }
      />

      {/* Content */}
      <main className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6 min-w-0">
        {/* Gesamtstatus */}
        <div className={cn(
          'rounded-2xl border p-6 mb-8 transition-all',
          STATUS_BG[overallStatus],
        )}>
          <div className="flex items-center gap-4">
            {loading ? (
              <RefreshCw className="h-8 w-8 text-[#6b7280] animate-spin" />
            ) : (
              <OverallIcon className="h-8 w-8" style={{ color: overallColor }} />
            )}
            <div>
              <h1 className="text-xl font-bold text-white sm:text-2xl">{overallLabel}</h1>
              {data?.last_updated && (
                <p className="text-sm text-[#7a82a6] mt-1 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Zuletzt aktualisiert: {formatDate(data.last_updated)}
                </p>
              )}
            </div>
          </div>
        </div>

        {error && !data && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 mb-8 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Dienstkarten */}
        {loading && !data ? (
          <div className="grid gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-xl border border-[#1e2240] bg-[#12152a]/80 p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 rounded-lg bg-[#1a1e38]" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 rounded bg-[#1a1e38]" />
                    <div className="h-3 w-48 rounded bg-[#1a1e38]" />
                  </div>
                </div>
                <div className="h-[32px] rounded bg-[#1a1e38]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {data?.overall?.services?.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}

        {/* Störungshistorie */}
        {data && data.incidents.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#a6adca]" />
              Störungshistorie
            </h2>
            <div className="grid gap-3">
              {data.incidents.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} />
              ))}
            </div>
          </div>
        )}

        {data && data.incidents.length === 0 && (
          <div className="mt-10 rounded-xl border border-[#1e2240] bg-[#12152a]/60 p-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500/60 mx-auto mb-2" />
            <p className="text-sm text-[#7a82a6]">Keine aktuellen Störungen</p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 border-t border-[#1e2240] pt-6 pb-8 text-center text-xs text-[#5a6180]">
          <p>Astra Monitoring · Automatische Aktualisierung alle 60 Sekunden</p>
        </footer>
      </main>
    </div>
  );
}
