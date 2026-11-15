import { useEffect, useState, useCallback } from 'react';
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
  ChevronLeft,
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

function StatusBar({ day }: { day: DayHistory }) {
  const [hover, setHover] = useState(false);
  const color = STATUS_COLORS[day.status] || STATUS_COLORS.unknown;
  const d = new Date(day.date);
  const label = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });

  return (
    <div className="status-bar relative" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div
        className="rounded-[2px] transition-all duration-150 cursor-pointer"
        style={{
          height: '34px',
          backgroundColor: color,
          opacity: hover ? 1 : 0.85,
          transform: hover ? 'scaleY(1.15)' : 'scaleY(1)',
        }}
      />
      {hover && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 whitespace-nowrap rounded-lg border border-[#2a2f4a] bg-[#161929] px-3 py-2 text-xs shadow-xl pointer-events-none">
          <p className="font-medium text-white">{label}</p>
          <p className="text-[#a6adca]">{STATUS_LABELS[day.status] || 'Unbekannt'}</p>
          {day.status !== 'unknown' && <p className="text-[#a6adca]">{day.uptime_percent}% Verfügbarkeit</p>}
        </div>
      )}
    </div>
  );
}

function ServiceCard({ service }: { service: ServiceStatus }) {
  const Icon = SERVICE_ICONS[service.name] || Activity;
  const statusColor = STATUS_COLORS[service.current_status] || STATUS_COLORS.unknown;
  const statusLabel = STATUS_LABELS[service.current_status] || 'Unbekannt';

  return (
    <div className="rounded-xl border border-[#1e2240] bg-[#12152a]/80 p-5 transition-all hover:border-[#2a2f4a]">
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

      {/* Historische Balken – einheitlich für alle Viewports */}
      <div
        className="status-history-grid w-full"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${service.daily_history.length}, 1fr)`,
          gap: '1.5px',
        }}
      >
        {service.daily_history.map((day) => (
          <StatusBar key={day.date} day={day} />
        ))}
      </div>

      {/* Zeitachse */}
      <div className="flex items-center justify-between mt-2 text-[0.7rem] text-[#5a6180]">
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
