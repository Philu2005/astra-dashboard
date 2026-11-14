import React, { useState, useMemo, useEffect } from 'react';
import {
  Server,
  Search,
  CheckCircle2,
  ExternalLink,
  Settings,
  Filter,
  RefreshCw,
  Users,
  Info,
  Loader2,
  AlertTriangle,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { appConfig } from '@/lib/app-config';
import { useServerContext, iconColors, type DisplayServer } from '@/contexts/ServerContext';
import { useAuth } from '@/contexts/AuthContext';

// --- Helpers ---

type FilterType = 'all' | 'owner' | 'admin';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Gute Nacht';
  if (hour < 12) return 'Guten Morgen';
  if (hour < 18) return 'Guten Tag';
  return 'Guten Abend';
}

// --- Server Card Component ---

interface ServerCardProps {
  server: DisplayServer;
  colorClass: string;
  onManage?: () => void;
}

const ServerCard: React.FC<ServerCardProps> = ({ server, colorClass, onManage }) => {
  return (
    <div className="bg-[linear-gradient(180deg,#151828_0%,#121524_100%)] border border-[#2e334a] p-5 rounded-[1.05rem] hover:border-astra-purple/50 transition-all duration-300 group relative overflow-hidden shadow-astra">
      <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0)_42%)] pointer-events-none" />
      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3.5">
          {server.icon ? (
            <img
              src={server.icon}
              alt={server.name}
              className="w-12 h-12 rounded-xl shrink-0 border border-white/10 shadow-[0_12px_26px_-20px_rgba(75,70,200,0.95)] object-cover"
            />
          ) : (
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center text-white text-[0.85rem] font-bold shrink-0 border border-white/10 shadow-[0_12px_26px_-20px_rgba(75,70,200,0.95)]",
              colorClass
            )}>
              {server.initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-semibold text-[1.15rem] leading-snug truncate group-hover:text-astra-cyan transition-colors duration-300">
              {server.name}
            </h4>
            <p className="text-[#6b7194] text-[0.78rem] mt-0.5 leading-none flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              {server.memberCount.toLocaleString('de-DE')} Mitglieder
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-300 text-[0.82rem] font-medium">Astra ist hier</span>
        </div>

        {/* Action */}
        <button
          onClick={onManage}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-[#5f58d8] bg-[linear-gradient(90deg,rgba(83,76,205,0.5)_0%,rgba(83,76,205,0.25)_100%)] text-white text-[0.88rem] font-semibold hover:border-[#8881ff] hover:shadow-[0_14px_30px_-18px_rgba(110,100,255,0.8)] transition-all duration-300"
        >
          <Settings className="w-4 h-4" />
          Verwalten
        </button>
      </div>
    </div>
  );
};

// --- Main Component ---

export const Servers = () => {
  const { servers, selectServer, selectedServer, loadingState, refresh } = useServerContext();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [managingServerId, setManagingServerId] = useState<string | null>(null);

  // Sync management view when server is selected via sidebar dropdown
  useEffect(() => {
    if (selectedServer) {
      setManagingServerId(selectedServer.id);
    }
  }, [selectedServer]);

  const displayName = user?.display_name || user?.username || 'Benutzer';

  // Filtered servers
  const filteredServers = useMemo(() => {
    return servers.filter((server) => {
      const matchesSearch = server.name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === 'all' ||
        (filter === 'owner' && server.owner) ||
        (filter === 'admin' && !server.owner);
      return matchesSearch && matchesFilter;
    });
  }, [search, filter, servers]);

  const filterButtons: { label: string; value: FilterType }[] = [
    { label: 'Alle Server', value: 'all' },
    { label: 'Eigene Server', value: 'owner' },
    { label: 'Admin-Zugriff', value: 'admin' },
  ];

  // --- Loading State ---
  if (loadingState.status === 'idle' || loadingState.status === 'loading') {
    return (
      <div className="space-y-5 lg:space-y-6 w-full">
        <section className="pt-2 lg:pt-3 space-y-2">
          <h2 className="text-[2.65rem] xl:text-[2.95rem] font-semibold text-white tracking-[-0.02em] leading-[1.1]">
            {getGreeting()}, {displayName}
          </h2>
          <p className="text-[#c1c7de] text-[1.75rem] xl:text-[1.95rem] font-normal max-w-4xl leading-tight">
            Server werden geladen…
          </p>
        </section>
        <div className="bg-[linear-gradient(180deg,#141728_0%,#121524_100%)] border border-[#2d3246] rounded-[1.15rem] p-10 shadow-astra text-center">
          <Loader2 className="w-10 h-10 text-[#9d94ff] mx-auto mb-3 animate-spin" />
          <p className="text-[#9ca2be] text-[1.1rem] font-medium">Serverliste wird geladen…</p>
        </div>
      </div>
    );
  }

  // --- Unavailable State ---
  if (loadingState.status === 'unavailable') {
    return (
      <div className="space-y-5 lg:space-y-6 w-full">
        <section className="pt-2 lg:pt-3 space-y-2">
          <h2 className="text-[2.65rem] xl:text-[2.95rem] font-semibold text-white tracking-[-0.02em] leading-[1.1]">
            {getGreeting()}, {displayName}
          </h2>
          <p className="text-[#c1c7de] text-[1.75rem] xl:text-[1.95rem] font-normal max-w-4xl leading-tight">
            Astra ist derzeit nicht erreichbar.
          </p>
        </section>
        <div className="bg-[linear-gradient(180deg,#141728_0%,#121524_100%)] border border-[#2d3246] rounded-[1.15rem] p-10 shadow-astra text-center space-y-3">
          <WifiOff className="w-10 h-10 text-[#8288a5] mx-auto" />
          <p className="text-[#9ca2be] text-[1.1rem] font-medium">Astra ist derzeit nicht erreichbar.</p>
          <p className="text-[#6b7194] text-[0.9rem]">Bitte versuche es später erneut.</p>
          <button
            onClick={refresh}
            className="mt-2 flex items-center gap-2 px-4 h-10 rounded-xl border border-[#5f58d8] bg-[linear-gradient(90deg,rgba(83,76,205,0.5)_0%,rgba(83,76,205,0.25)_100%)] text-white text-[0.88rem] font-semibold hover:border-[#8881ff] hover:shadow-[0_14px_30px_-18px_rgba(110,100,255,0.8)] transition-all duration-300 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (loadingState.status === 'error') {
    return (
      <div className="space-y-5 lg:space-y-6 w-full">
        <section className="pt-2 lg:pt-3 space-y-2">
          <h2 className="text-[2.65rem] xl:text-[2.95rem] font-semibold text-white tracking-[-0.02em] leading-[1.1]">
            {getGreeting()}, {displayName}
          </h2>
          <p className="text-[#c1c7de] text-[1.75rem] xl:text-[1.95rem] font-normal max-w-4xl leading-tight">
            Fehler beim Laden der Server.
          </p>
        </section>
        <div className="bg-[linear-gradient(180deg,#141728_0%,#121524_100%)] border border-[#2d3246] rounded-[1.15rem] p-10 shadow-astra text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
          <p className="text-[#9ca2be] text-[1.1rem] font-medium">{loadingState.error}</p>
          <button
            onClick={refresh}
            className="mt-2 flex items-center gap-2 px-4 h-10 rounded-xl border border-[#5f58d8] bg-[linear-gradient(90deg,rgba(83,76,205,0.5)_0%,rgba(83,76,205,0.25)_100%)] text-white text-[0.88rem] font-semibold hover:border-[#8881ff] hover:shadow-[0_14px_30px_-18px_rgba(110,100,255,0.8)] transition-all duration-300 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  // --- Server Management View ---
  const managingServer = managingServerId
    ? servers.find((s) => s.id === managingServerId) ?? null
    : null;

  if (managingServer) {
    return (
      <div className="space-y-5 lg:space-y-6 w-full">
        <section className="space-y-2 pt-2 lg:pt-3">
          <button
            onClick={() => setManagingServerId(null)}
            className="text-[#9d94ff] hover:text-astra-cyan text-[1rem] font-medium transition-colors duration-300 mb-1 flex items-center gap-1.5"
          >
            ← Zurück zur Serverliste
          </button>
          <h2 className="text-[2.65rem] xl:text-[2.95rem] font-semibold text-white tracking-[-0.02em] flex flex-wrap items-center gap-3 leading-[1.1]">
            {managingServer.name}
          </h2>
          <p className="text-[#c1c7de] text-[1.75rem] xl:text-[1.95rem] font-normal max-w-4xl leading-tight">
            Serververwaltung für {managingServer.name}
          </p>
        </section>

        <div className="bg-[linear-gradient(180deg,#141728_0%,#121524_100%)] border border-[#2d3246] rounded-[1.15rem] p-5 space-y-4 shadow-astra">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-[#9d94ff]" />
            <h3 className="text-white font-semibold text-[2.1rem] tracking-tight leading-none">Serververwaltung</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1a1e33] border border-[#2d3246] rounded-xl p-4 space-y-2">
              <p className="text-[#8288a5] text-[0.73rem] font-medium uppercase tracking-[0.08em]">Mitglieder</p>
              <p className="text-white text-[1.1rem] font-semibold">{managingServer.memberCount.toLocaleString('de-DE')}</p>
            </div>
            <div className="bg-[#1a1e33] border border-[#2d3246] rounded-xl p-4 space-y-2">
              <p className="text-[#8288a5] text-[0.73rem] font-medium uppercase tracking-[0.08em]">Status</p>
              <p className="text-emerald-300 text-[1.1rem] font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Astra installiert
              </p>
            </div>
            <div className="bg-[#1a1e33] border border-[#2d3246] rounded-xl p-4 space-y-2">
              <p className="text-[#8288a5] text-[0.73rem] font-medium uppercase tracking-[0.08em]">Rolle</p>
              <p className="text-white text-[1.1rem] font-semibold">{managingServer.owner ? 'Eigentümer' : 'Administrator'}</p>
            </div>
          </div>
          <div className="mt-4 p-6 rounded-xl border border-[#2d3246] bg-[#12152480] text-center">
            <p className="text-[#9ca2be] text-[1.1rem]">
              Die Serververwaltung wird in einem zukünftigen Update verfügbar sein.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Server List View ---
  return (
    <div className="space-y-5 lg:space-y-6 w-full">
      {/* Greeting */}
      <section className="pt-2 lg:pt-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-2">
            <h2 className="text-[2.65rem] xl:text-[2.95rem] font-semibold text-white tracking-[-0.02em] leading-[1.1]">
              {getGreeting()}, {displayName}
            </h2>
            <p className="text-[#c1c7de] text-[1.75rem] xl:text-[1.95rem] font-normal max-w-4xl leading-tight">
              Du verwaltest {servers.length} Server mit Astra.
            </p>
          </div>
          <button
            onClick={refresh}
            disabled={false}
            className="flex items-center gap-2 px-4 h-10 rounded-xl border border-[#5f58d8] bg-[linear-gradient(90deg,rgba(83,76,205,0.5)_0%,rgba(83,76,205,0.25)_100%)] text-white text-[0.88rem] font-semibold hover:border-[#8881ff] hover:shadow-[0_14px_30px_-18px_rgba(110,100,255,0.8)] transition-all duration-300 shrink-0 disabled:opacity-60"
          >
            <RefreshCw className="w-4 h-4" />
            Aktualisieren
          </button>
        </div>
      </section>

      {/* Search & Filters */}
      <div className="bg-[linear-gradient(180deg,#141728_0%,#121524_100%)] border border-[#2d3246] rounded-[1.15rem] p-5 shadow-astra space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#8288a5] pointer-events-none" />
            <input
              type="text"
              placeholder="Server suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-[#1a1e33] border border-[#2d3246] rounded-xl text-white text-[0.95rem] font-medium placeholder:text-[#6b7194] focus:outline-none focus:border-[#5f58d8] focus:ring-1 focus:ring-[#5f58d8]/30 transition-all duration-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#8288a5] shrink-0 hidden sm:block" />
            {filterButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setFilter(btn.value)}
                className={cn(
                  "px-3.5 h-11 rounded-xl text-[0.88rem] font-medium transition-all duration-200 border whitespace-nowrap",
                  filter === btn.value
                    ? "bg-[linear-gradient(90deg,rgba(83,76,205,0.6)_0%,rgba(83,76,205,0.3)_100%)] border-[#5f58d8] text-white shadow-[0_10px_26px_-18px_rgba(75,70,200,0.92)]"
                    : "text-[#acb3cf] border-[#2d3246] bg-[#1a1e33] hover:text-[#f0f2ff] hover:border-[#373c53]"
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Server Grid */}
      {filteredServers.length === 0 ? (
        <div className="bg-[linear-gradient(180deg,#141728_0%,#121524_100%)] border border-[#2d3246] rounded-[1.15rem] p-10 shadow-astra text-center">
          <Server className="w-10 h-10 text-[#8288a5] mx-auto mb-3" />
          <p className="text-[#9ca2be] text-[1.1rem] font-medium">
            {servers.length === 0 ? 'Keine verwaltbaren Server gefunden.' : 'Keine Server gefunden.'}
          </p>
          <p className="text-[#6b7194] text-[0.9rem] mt-1">
            {servers.length === 0
              ? 'Lade Astra auf einen Server ein, auf dem du Verwaltungsrechte besitzt.'
              : 'Passe deine Suche oder Filter an.'}
          </p>
          {servers.length === 0 && (
            <a
              href={appConfig.botInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-4 h-10 rounded-xl border border-[#2d3246] bg-[#1a1e33] text-[#acb3cf] text-[0.88rem] font-semibold hover:text-white hover:border-[#5f58d8] hover:bg-[linear-gradient(90deg,rgba(83,76,205,0.4)_0%,rgba(83,76,205,0.2)_100%)] transition-all duration-300"
            >
              <ExternalLink className="w-4 h-4" />
              Astra einladen
            </a>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
          {filteredServers.map((server, idx) => (
            <ServerCard
              key={server.id}
              server={server}
              colorClass={iconColors[idx % iconColors.length]}
              onManage={() => { selectServer(server.id); setManagingServerId(server.id); }}
            />
          ))}
        </div>
      )}

      {/* Missing Server Hint */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl border border-[#2d3246] bg-[#141728]/60 text-[#8288a5] text-[0.85rem] leading-relaxed">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Ein Server fehlt? Du brauchst dort das Recht „Server verwalten". Nach dem Einladen von Astra kannst du auf „Aktualisieren" klicken.
        </span>
      </div>
    </div>
  );
};
