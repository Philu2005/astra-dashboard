import React from 'react';
import { StatCard } from '@/components/StatCard';
import { QuickAccessCard } from '@/components/QuickAccessCard';
import { AstraLogo } from '@/components/AstraLogo';
import { Loader2 } from 'lucide-react';
import { useBotStatus, botStatusConfig } from '@/hooks/useBotStatus';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useCommandStatistics } from '@/hooks/useCommandStatistics';
import {
  Users,
  Layout,
  Zap,
  Shield,
  Ticket,
  ShieldAlert,
  History,
  Star,
  Trophy,
  UserPlus,
  ArrowRight,
  Cpu,
  Activity,
  Globe,
  BarChart3,
} from 'lucide-react';

type ChartPoint = { day: string; value: number };

// Chart layout constants (visual only)
const DEFAULT_TICKS = [6000, 4000, 2000, 0];
const chartHeight = 244;
const chartWidth = 520;
const chartPadding = {
  top: 18,
  right: 18,
  bottom: 34,
  left: 52,
};

const chartInnerWidth = chartWidth - chartPadding.left - chartPadding.right;
const chartInnerHeight = chartHeight - chartPadding.top - chartPadding.bottom;
const calcPointX = (index: number, len: number) =>
  chartPadding.left + (chartInnerWidth / Math.max(1, len - 1)) * index;
const calcPointY = (value: number, maxValue: number) =>
  chartPadding.top + ((maxValue - value) / Math.max(1, maxValue)) * chartInnerHeight;

const statusConfig = botStatusConfig;

const formatNumber = (n: number): string => n.toLocaleString('de-DE');

export const Dashboard = () => {
  const botStatus = useBotStatus();
  const { data: statsData, loading: statsLoading, error: statsError } = useDashboardStats();
  const { data: cmdStats, loading: cmdLoading, error: cmdError } = useCommandStatistics();

  const commandData: ChartPoint[] = React.useMemo(() => {
    if (!cmdStats || !cmdStats.data) return [];
    return cmdStats.data.map((d) => ({ day: d.weekday.slice(0, 2), value: d.count }));
  }, [cmdStats]);

  const maxValue = React.useMemo(() => {
    const max = Math.max(0, ...commandData.map((d) => d.value));
    // runde auf sinnvolle Schrittweite auf (z.B. 10er/50er/100er)
    if (max <= 10) return 10;
    if (max <= 50) return 50;
    if (max <= 100) return 100;
    // 10% Puffer
    return Math.ceil(max * 1.1);
  }, [commandData]);

  const yTicks = React.useMemo(() => {
    if (commandData.length === 0) return DEFAULT_TICKS;
    const t3 = Math.round((maxValue * 2) / 3);
    const t2 = Math.round(maxValue / 3);
    return [maxValue, t3, t2, 0];
  }, [commandData.length, maxValue]);

  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  const points = React.useMemo(() => {
    return commandData.map((entry, index) => ({
      ...entry,
      x: calcPointX(index, commandData.length || 1),
      y: calcPointY(entry.value, maxValue),
    }));
  }, [commandData, maxValue]);

  const linePath = React.useMemo(() => points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '), [points]);
  const areaPath = React.useMemo(
    () =>
      points.length
        ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - chartPadding.bottom} L ${points[0].x} ${chartHeight - chartPadding.bottom} Z`
        : '',
    [linePath, points]
  );

  const activeIndex = hoveredIndex ?? selectedIndex;
  const activePoint = activeIndex === null || points.length === 0 ? null : points[activeIndex];

  // Tooltip: vollständige Infos (Wochentag + Datum) aus Originaldaten
  const activeMeta = React.useMemo(() => {
    if (!cmdStats?.data || activeIndex == null) return null;
    const d = cmdStats.data[activeIndex];
    return { weekday: d.weekday, date: d.date, count: d.count };
  }, [cmdStats, activeIndex]);

  const activityItems = [
    { title: 'Ticketsystem aktualisiert', subtitle: 'Astra Community', time: 'vor 12 Minuten', icon: History },
    { title: 'Joinrole hinzugefügt', subtitle: 'Astra Community', time: 'vor 37 Minuten', icon: UserPlus },
    { title: 'Automod-Regel angepasst', subtitle: 'Gaming Lounge', time: 'vor 1 Stunde', icon: ShieldAlert },
    { title: 'Neue Moderatorenrechte gesetzt', subtitle: 'Astra Community', time: 'vor 2 Stunden', icon: Shield },
    { title: 'Level-Belohnung aktualisiert', subtitle: 'Creator Hub', time: 'vor 3 Stunden', icon: Trophy },
  ];

  const tooltipWidth = 136;
  const tooltipHeight = 58;
  const tooltipHalf = tooltipWidth / 2;
  // Intelligente Positionierung: Horizontal clamp, Vertikal ober-/unterhalb je nach Platz
  const placeAbove = activePoint ? activePoint.y - (tooltipHeight + 12) >= chartPadding.top : true;
  const rawLeft = activePoint ? activePoint.x : 0;
  const tooltipLeft = activePoint ? Math.max(tooltipHalf, Math.min(chartWidth - tooltipHalf, rawLeft)) : 0;
  const desiredTop = activePoint ? (placeAbove ? activePoint.y - tooltipHeight - 12 : activePoint.y + 12) : 0;
  const minTop = 6;
  const maxTop = chartHeight - tooltipHeight - 6;
  const tooltipTop = Math.max(minTop, Math.min(maxTop, desiredTop));
  const tooltipPointerOffset = activePoint ? Math.max(-38, Math.min(38, activePoint.x - tooltipLeft)) : 0;

  return (
    <div className="space-y-5 lg:space-y-6 w-full">
      {/* Welcome Section */}
      <section className="space-y-2 pt-2 lg:pt-3">
        <h2 className="text-[2.65rem] xl:text-[2.95rem] font-semibold text-white tracking-[-0.02em] flex flex-wrap items-center gap-3 leading-[1.1]">
          Willkommen zurück, Philipp <span className="text-[2.55rem] inline-block origin-[72%_72%] animate-[astra-wave_4.8s_ease-in-out_infinite]">👋</span>
        </h2>
        <p className="text-[#c1c7de] text-[1.75rem] xl:text-[1.95rem] font-normal max-w-4xl leading-tight">Verwalte deine Server, Module und Einstellungen von Astra.</p>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Server"
          value={statsLoading ? '…' : statsError ? '–' : formatNumber(statsData!.stats.guilds)}
          icon={Layout}
          className={statsData?.stale ? 'opacity-60' : undefined}
        />
        <StatCard
          title="Nutzer"
          value={statsLoading ? '…' : statsError ? '–' : formatNumber(statsData!.stats.users)}
          icon={Users}
          className={statsData?.stale ? 'opacity-60' : undefined}
        />
        <StatCard
          title="Befehle"
          value={statsLoading ? '…' : statsError ? '–' : formatNumber(statsData!.stats.commands)}
          icon={Zap}
          className={statsData?.stale ? 'opacity-60' : undefined}
        />
        <StatCard title="Aktive Module" value="8 / 10" icon={Shield} />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,68fr)_minmax(390px,32fr)] gap-5 items-start">
        {/* Left Column: Quick Access & Activities */}
        <div className="space-y-5 min-w-0">
          {/* Quick Access */}
          <div className="bg-[linear-gradient(180deg,#141728_0%,#121524_100%)] border border-[#2d3246] rounded-[1.15rem] p-5 space-y-3.5 shadow-astra">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-[#9d94ff]" />
              <h3 className="text-white font-semibold text-[2.1rem] tracking-tight leading-none">Schnellzugriff</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3.5">
              <QuickAccessCard title="Tickets" description="Konfigurieren" icon={Ticket} />
              <QuickAccessCard title="Automod" description="Regeln verwalten" icon={ShieldAlert} />
              <QuickAccessCard title="Modlog" description="Events & Logs" icon={History} />
              <QuickAccessCard title="Reaction Roles" description="Rollen über Reaktionen" icon={Star} />
              <QuickAccessCard title="Levels" description="XP & Level-System" icon={Trophy} />
              <QuickAccessCard title="Joinroles" description="Rollen bei Beitritt" icon={UserPlus} />
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-[linear-gradient(180deg,#141728_0%,#121524_100%)] border border-[#2d3246] rounded-[1.15rem] p-5 space-y-4 shadow-astra">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-[#9d94ff]" />
                <h3 className="text-white font-semibold text-[1.96rem] tracking-tight leading-none">Letzte Aktivitäten</h3>
              </div>
              <button className="text-[1rem] font-medium text-[#9d94ff] hover:text-astra-cyan flex items-center gap-1.5 transition-all duration-300">
                ALLE AKTIVITÄTEN <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1.5">
              {activityItems.map((activity, idx) => (
                <div
                  key={idx}
                  className={`items-center gap-3.5 p-2.5 rounded-xl hover:bg-[#1b1f32]/85 transition-all duration-300 group cursor-pointer border border-transparent hover:border-[#373c53] ${
                    idx === 3 ? 'hidden md:flex' : idx === 4 ? 'hidden xl:flex' : 'flex'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#1f2338] flex items-center justify-center text-[#a18fff] group-hover:text-astra-cyan group-hover:bg-astra-purple/10 transition-all duration-300 border border-[#373c53] shrink-0">
                    <activity.icon className="w-[25px] h-[25px]" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-white font-semibold text-[1.05rem] sm:text-[1.12rem] group-hover:text-astra-cyan transition-colors leading-snug">{activity.title}</h5>
                    <p className="text-[#989fbb] text-[0.86rem] sm:text-[0.92rem] font-normal mt-0.5 leading-none">{activity.subtitle}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[#9ca2be] text-[0.81rem] sm:text-[0.86rem] font-medium whitespace-nowrap">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Bot Status & Chart */}
        <div className="space-y-5 min-w-0">
          {/* Bot Status Card */}
          <div className="bg-[linear-gradient(180deg,#141728_0%,#121524_100%)] border border-[#2d3246] rounded-[1.15rem] p-5 xl:p-[1.375rem] space-y-[1.125rem] shadow-astra relative overflow-hidden group min-h-[214px]">
             <div className="flex items-center justify-between relative z-10">
               <div className="flex items-center gap-4">
                 <div className="relative flex items-center justify-center w-[48px] h-[48px] bg-[#4b46c8] rounded-xl shadow-astra-glow overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500">
                   <AstraLogo size={48} glow="soft" fill className="scale-[1.18]" />
                 </div>
                 <div>
                    <h4 className="text-white font-semibold text-[1.88rem] tracking-tight leading-none">Astra Bot</h4>
                    <p className="text-[#9399b5] text-[0.94rem] font-medium tracking-[0.09em] mt-1 uppercase">v3.2.0</p>
                 </div>
               </div>
               <div className="flex flex-col items-end gap-1">
                  {botStatus === 'loading' ? (
                    <span className={`${statusConfig.loading.bg} ${statusConfig.loading.text} text-[0.76rem] font-semibold px-2.5 py-1 rounded-full border ${statusConfig.loading.border} uppercase tracking-[0.08em] flex items-center gap-1.5`}>
                      <Loader2 className="w-3 h-3 animate-spin" />
                    </span>
                  ) : (
                    <span className={`${statusConfig[botStatus].bg} ${statusConfig[botStatus].text} text-[0.76rem] font-semibold px-2.5 py-1 rounded-full border ${statusConfig[botStatus].border} uppercase tracking-[0.08em]`}>
                      {statusConfig[botStatus].label}
                    </span>
                  )}
               </div>
             </div>
             <div className="h-px bg-[#2e3449] mt-0.5" />
             
             <div className="grid grid-cols-3 gap-3.5 pt-1 relative z-10 text-left">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1 text-[#8288a5]">
                      <Activity className="w-3.5 h-3.5" />
                      <span className="text-[0.73rem] font-medium uppercase tracking-[0.08em]">Latenz</span>
                   </div>
                   <p className="text-emerald-300 text-[1.5rem] lg:text-[1.62rem] font-semibold leading-none whitespace-nowrap">32 ms</p>
                </div>
                <div className="space-y-1 min-w-0">
                   <div className="flex items-center gap-1 text-[#8288a5]">
                      <Globe className="w-3.5 h-3.5" />
                      <span className="text-[0.73rem] font-medium uppercase tracking-[0.08em]">Uptime</span>
                   </div>
                   <p className="text-white text-[1.5rem] lg:text-[1.62rem] font-semibold leading-none whitespace-nowrap">99,98 %</p>
                </div>
                <div className="space-y-1 min-w-0">
                   <div className="flex items-center gap-1 text-[#8288a5]">
                      <Cpu className="w-3.5 h-3.5" />
                      <span className="text-[0.73rem] font-medium uppercase tracking-[0.08em]">Speicher</span>
                   </div>
                   <p className="text-white text-[1.5rem] lg:text-[1.62rem] font-semibold leading-none whitespace-nowrap">312 MB</p>
                </div>
             </div>
          </div>

          {/* Commands Chart */}
          <div className="bg-[linear-gradient(180deg,#141728_0%,#121524_100%)] border border-[#2d3246] rounded-[1.15rem] p-4 sm:p-5 space-y-4 shadow-astra min-h-[300px] sm:min-h-[330px] overflow-hidden">
             <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pb-1">
                <BarChart3 className="w-5 h-5 text-[#9d94ff]" />
                <h3 className="text-white font-semibold text-[1.46rem] sm:text-[1.72rem] lg:text-[1.92rem] tracking-tight leading-none">Befehle <span className="text-[#9299b4] text-[0.9rem] sm:text-[1rem] lg:text-[1.05rem] font-medium ml-1">(letzte 7 Tage)</span></h3>
             </div>

             {cmdLoading ? (
                <div className="flex items-center justify-center h-[220px] text-[#9d94ff]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : cmdError ? (
                <div className="flex items-center justify-center h-[220px]">
                  <span className="text-[#c8ccde] text-sm">Statistiken konnten nicht geladen werden.</span>
                </div>
              ) : commandData.length === 0 ? (
                <div className="flex items-center justify-center h-[220px]">
                  <span className="text-[#8d93b0] text-sm">Keine Daten verfügbar.</span>
                </div>
              ) : (
              <div
                className="w-full relative min-h-[212px] sm:min-h-[236px]"
                onPointerLeave={() => setHoveredIndex(null)}
              >
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto" role="img" aria-label="Befehle der letzten 7 Tage">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7e5dff" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#4b46c8" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="chartLineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#7f6aff" />
                      <stop offset="100%" stopColor="#9b8bff" />
                    </linearGradient>
                    <filter id="pointGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="tooltipShadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#4b46c8" floodOpacity="0.25" />
                      <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#000000" floodOpacity="0.35" />
                    </filter>
                  </defs>

                  {yTicks.map((tick) => {
                    const y = calcPointY(tick, maxValue);
                    return (
                      <g key={tick}>
                        <line x1={chartPadding.left} y1={y} x2={chartWidth - chartPadding.right} y2={y} stroke="#2a2f45" strokeWidth="1" />
                        <text x={chartPadding.left - 14} y={y + 4} fill="#8c93b0" fontSize="12" textAnchor="end">
                          {tick.toLocaleString('de-DE')}
                        </text>
                      </g>
                    );
                  })}

                  {areaPath && (
                    <path
                      d={areaPath}
                      fill="url(#chartGradient)"
                      className="motion-reduce:animate-none animate-[astra-pulse_1.8s_ease-in-out_1]"
                      opacity={0.9}
                    />
                  )}
                  {linePath && (
                    <path
                      d={linePath}
                      fill="none"
                      stroke={activeIndex != null ? "url(#chartLineGrad)" : "#8f6cff"}
                      strokeWidth={activeIndex != null ? 3.5 : 3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength={100}
                      className="[stroke-dasharray:100] motion-reduce:[stroke-dasharray:unset] [stroke-dashoffset:100] motion-reduce:[stroke-dashoffset:unset] animate-[astra-draw_1.1s_cubic-bezier(0.22,1,0.36,1)_1]"
                      style={{ filter: activeIndex != null ? 'drop-shadow(0 0 6px rgba(155,139,255,0.35))' as any : undefined }}
                    />
                  )}

                  {points.map((point, index) => {
                    const isActive = index === activeIndex;

                    return (
                      <g key={point.day}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={isActive ? 6.5 : 4.25}
                          fill="#8f6cff"
                          stroke="#f3f4ff"
                          strokeWidth="1.4"
                          filter={isActive ? 'url(#pointGlow)' : undefined}
                          className="transition-[r,filter] duration-200 ease-out"
                        />
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={16}
                          fill="transparent"
                          onPointerEnter={() => setHoveredIndex(index)}
                          onPointerDown={() => {
                            setSelectedIndex(index);
                            setHoveredIndex(index);
                          }}
                          onFocus={() => setHoveredIndex(index)}
                          onBlur={() => setHoveredIndex(null)}
                          style={{ cursor: 'pointer' }}
                          role="button"
                          aria-label={`Tag ${index + 1}: ${commandData[index].value.toLocaleString('de-DE')} Befehle`}
                          tabIndex={0}
                        />
                      </g>
                    );
                  })}
                </svg>

                <div className="mt-2 ml-8 mr-2 sm:mt-2.5 sm:ml-11 sm:mr-4 grid grid-cols-7">
                  {commandData.map((entry, index) => (
                    <span
                      key={entry.day}
                      className={`text-[0.72rem] sm:text-[0.88rem] font-medium uppercase tracking-[0.08em] text-center ${index === activeIndex ? 'text-[#c8ccde]' : 'text-[#8d93b0]'}`}
                    >
                      {entry.day}
                    </span>
                  ))}
                </div>

                {/* Custom Tooltip (SVG Overlay, sanfte Bewegungen, dunkles Theme) */}
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="absolute inset-0 w-full h-auto pointer-events-none z-20"
                  aria-hidden="true"
                >
                  <g
                    transform={`translate(${(activePoint ? tooltipLeft - tooltipHalf : -9999).toFixed(2)} ${(activePoint ? tooltipTop : -9999).toFixed(2)})`}
                    style={{
                      transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1), opacity 160ms ease-out',
                      opacity: activePoint ? 1 : 0,
                    }}
                    filter="url(#tooltipShadow)"
                  >
                    <rect
                      width={tooltipWidth}
                      height={tooltipHeight}
                      rx={10}
                      fill="rgba(16,21,38,0.96)"
                      stroke="#5e67e9"
                      strokeOpacity="0.9"
                      strokeWidth="1"
                    />
                    {/* Pointer (Diamant ohne übertriebenen Pfeil) */}
                    <rect
                      x={tooltipHalf + tooltipPointerOffset - 5}
                      y={placeAbove ? tooltipHeight - 1 : -4}
                      width={10}
                      height={10}
                      transform={`rotate(45 ${tooltipHalf + tooltipPointerOffset} ${placeAbove ? tooltipHeight + 4 : 1})`}
                      fill="rgba(16,21,38,0.96)"
                      stroke="#5e67e9"
                      strokeOpacity="0.9"
                      strokeWidth="1"
                    />
                    {/* Inhalt */}
                    <text x={12} y={18} fill="#9aa4c8" fontSize={9.5} letterSpacing="0.08em">
                      {activeMeta ? `${activeMeta.weekday.toUpperCase()}, ${new Date(activeMeta.date + 'T00:00:00Z').toLocaleDateString('de-DE')}` : ''}
                    </text>
                    <text x={12} y={36} fill="#f4f6ff" fontSize={16} fontWeight={700}>
                      {activeMeta ? activeMeta.count.toLocaleString('de-DE') : ''}
                    </text>
                    <text x={tooltipWidth - 12} y={36} fill="#b3b9d6" fontSize={10.5} textAnchor="end">
                      Befehle
                    </text>
                  </g>
                </svg>
              </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
