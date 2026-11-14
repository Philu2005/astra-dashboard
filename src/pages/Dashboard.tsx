import React from 'react';
import { StatCard } from '@/components/StatCard';
import { QuickAccessCard } from '@/components/QuickAccessCard';
import { AstraLogo } from '@/components/AstraLogo';
import { Loader2 } from 'lucide-react';
import { useBotStatus, botStatusConfig } from '@/hooks/useBotStatus';
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

type ChartPoint = {
  day: string;
  value: number;
};

const commandData: ChartPoint[] = [
  { day: 'Di', value: 2400 },
  { day: 'Mi', value: 3300 },
  { day: 'Do', value: 3100 },
  { day: 'Fr', value: 4050 },
  { day: 'Sa', value: 3400 },
  { day: 'So', value: 3850 },
  { day: 'Mo', value: 4650 },
];

const yTicks = [6000, 4000, 2000, 0];
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
const maxValue = 6000;

const pointX = (index: number) => chartPadding.left + (chartInnerWidth / (commandData.length - 1)) * index;
const pointY = (value: number) => chartPadding.top + ((maxValue - value) / maxValue) * chartInnerHeight;

const statusConfig = botStatusConfig;

export const Dashboard = () => {
  const botStatus = useBotStatus();
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(commandData.length - 1);
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(commandData.length - 1);

  const points = commandData.map((entry, index) => ({
    ...entry,
    x: pointX(index),
    y: pointY(entry.value),
  }));

  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - chartPadding.bottom} L ${points[0].x} ${chartHeight - chartPadding.bottom} Z`;

  const activeIndex = hoveredIndex ?? selectedIndex;
  const activePoint = activeIndex === null ? null : points[activeIndex];

  const activityItems = [
    { title: 'Ticketsystem aktualisiert', subtitle: 'Astra Community', time: 'vor 12 Minuten', icon: History },
    { title: 'Joinrole hinzugefügt', subtitle: 'Astra Community', time: 'vor 37 Minuten', icon: UserPlus },
    { title: 'Automod-Regel angepasst', subtitle: 'Gaming Lounge', time: 'vor 1 Stunde', icon: ShieldAlert },
    { title: 'Neue Moderatorenrechte gesetzt', subtitle: 'Astra Community', time: 'vor 2 Stunden', icon: Shield },
    { title: 'Level-Belohnung aktualisiert', subtitle: 'Creator Hub', time: 'vor 3 Stunden', icon: Trophy },
  ];

  const tooltipWidth = 114;
  const tooltipHeight = 44;
  const tooltipHalf = tooltipWidth / 2;
  const tooltipLeft = activePoint ? Math.max(tooltipHalf, Math.min(chartWidth - tooltipHalf, activePoint.x)) : 0;
  const tooltipTop = activePoint ? activePoint.y - tooltipHeight - 10 : 0;
  const tooltipPointerOffset = activePoint ? Math.max(-34, Math.min(34, activePoint.x - tooltipLeft)) : 0;

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
        <StatCard title="Server" value="52" trend="2" trendUp icon={Layout} />
        <StatCard title="Nutzer" value="10.482" trend="187" trendUp icon={Users} />
        <StatCard title="Befehle (24h)" value="3.921" trend="14%" trendUp icon={Zap} />
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
                    <filter id="pointGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {yTicks.map((tick) => {
                    const y = pointY(tick);
                    return (
                      <g key={tick}>
                        <line x1={chartPadding.left} y1={y} x2={chartWidth - chartPadding.right} y2={y} stroke="#2a2f45" strokeWidth="1" />
                        <text x={chartPadding.left - 14} y={y + 4} fill="#8c93b0" fontSize="12" textAnchor="end">
                          {tick.toLocaleString('de-DE')}
                        </text>
                      </g>
                    );
                  })}

                  <path d={areaPath} fill="url(#chartGradient)" className="animate-[astra-pulse_1.8s_ease-in-out_1]" />
                  <path d={linePath} fill="none" stroke="#8f6cff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                  {points.map((point, index) => {
                    const isActive = index === activeIndex;

                    return (
                      <g key={point.day}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={isActive ? 6 : 4}
                          fill="#8f6cff"
                          stroke="#f3f4ff"
                          strokeWidth="1.5"
                          filter={isActive ? 'url(#pointGlow)' : undefined}
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

                {activePoint && (
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="absolute inset-0 w-full h-auto pointer-events-none z-20"
                    aria-hidden="true"
                  >
                    <g transform={`translate(${tooltipLeft - tooltipHalf} ${tooltipTop})`}>
                      <rect
                        width={tooltipWidth}
                        height={tooltipHeight}
                        rx={9}
                        fill="rgba(17,22,41,0.95)"
                        stroke="#757ee3"
                        strokeOpacity="0.85"
                        strokeWidth="1"
                      />
                      <rect
                        x={tooltipHalf + tooltipPointerOffset - 4}
                        y={tooltipHeight - 0.8}
                        width={8}
                        height={8}
                        transform={`rotate(45 ${tooltipHalf + tooltipPointerOffset} ${tooltipHeight + 3.2})`}
                        fill="rgba(17,22,41,0.95)"
                        stroke="#757ee3"
                        strokeOpacity="0.85"
                        strokeWidth="1"
                      />
                      <text x={10} y={16} fill="#b8c0df" fontSize="9" letterSpacing="0.1em">{activePoint.day}</text>
                      <text x={10} y={31} fill="#f4f6ff" fontSize="12" fontWeight={600}>{activePoint.value.toLocaleString('de-DE')}</text>
                    </g>
                  </svg>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
