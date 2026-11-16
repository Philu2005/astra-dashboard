import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ChevronDown, Home, Menu, Server as ServerIconLucide } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useServerContext, iconColors, type DisplayServer } from '@/contexts/ServerContext';
import { cn } from '@/lib/utils';

interface ServerHeaderProps {
  onOpenSidebar?: () => void;
}

export const ServerHeader: React.FC<ServerHeaderProps> = ({ onOpenSidebar }) => {
  const { servers, selectedServer } = useServerContext();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const popRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!popRef.current) return;
      if (!popRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const filtered = useMemo(() => servers.filter(s => s.name.toLowerCase().includes(query.toLowerCase())), [servers, query]);

  const ServerGlyph = useCallback(({ server, size = 36 }: { server: DisplayServer; size?: number }) => {
    const idx = servers.indexOf(server);
    const bg = iconColors[idx % iconColors.length];
    if (server.icon) {
      return <img src={server.icon} alt={server.name} className="rounded-xl object-cover border border-white/10 shadow-[0_12px_26px_-20px_rgba(75,70,200,0.95)]" style={{ width: size, height: size }} />;
    }
    return (
      <div className={cn('rounded-xl flex items-center justify-center text-white font-bold border border-white/10 shadow-[0_12px_26px_-20px_rgba(75,70,200,0.95)]', bg)} style={{ width: size, height: size, fontSize: size * 0.34 }}>{server.initials}</div>
    );
  }, [servers]);

  return (
    <header className="sticky top-0 z-40 bg-[#131522]/90 backdrop-blur supports-[backdrop-filter]:bg-[#131522]/70 border-b border-layout-divider">
      <div className="px-4 sm:px-6 lg:px-8 h-[68px] flex items-center gap-3">
        {/* Mobile menu button */}
        <button onClick={onOpenSidebar} className="lg:hidden p-2 rounded-xl border border-layout-divider text-white bg-layout-topbar/70">
          <Menu className="w-5 h-5" />
        </button>

        {/* Back to servers */}
        <Link to="/servers" className="p-2 rounded-xl border border-layout-divider text-[#cfd5ee] hover:text-white hover:border-[#3d4260] bg-layout-topbar/40">
          <Home className="w-5 h-5" />
        </Link>

        {/* Current server + switcher */}
        <div className="relative" ref={popRef}>
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-3 px-3.5 h-12 rounded-xl text-white transition-all duration-300 border bg-[#13162a] border-[#2a2f45] hover:border-[#3d4260] hover:bg-[#161a30]"
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            {selectedServer ? (
              <ServerGlyph server={selectedServer} size={32} />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0 ring-1 ring-white/10 bg-astra-purple">??</div>
            )}
            <div className="flex-1 min-w-0 text-left">
              <span className="block font-semibold text-[0.98rem] truncate leading-tight">{selectedServer?.name ?? 'Server wählen'}</span>
              <span className="block text-[0.7rem] text-[#6b7194] leading-tight mt-0.5">Serververwaltung</span>
            </div>
            <ChevronDown className={cn('w-4 h-4 text-[#6b7194] transition-transform duration-300', open && 'rotate-180')} />
          </button>

          {open && (
            <div className="absolute left-0 mt-2 w-[360px] max-w-[86vw] rounded-xl border border-[#2e334a] bg-[#111425] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.03)_inset] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2.5 border-b border-[#1e2238]">
                <div className="relative">
                  <ServerIconLucide className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b7194] pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Server suchen…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                    className="w-full h-9 pl-9 pr-3 bg-[#0d0f1e] border border-[#252940] rounded-lg text-white text-[0.82rem] placeholder:text-[#4a5070] focus:outline-none focus:border-[#5f58d8]/50 transition-colors duration-200"
                  />
                </div>
              </div>
              <div className="py-1.5 max-h-[300px] overflow-y-auto scrollbar-hide">
                {filtered.map((s) => {
                  const isCurrent = s.id === selectedServer?.id;
                  return (
                    <button
                      key={s.id}
                      className={cn('w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-200', isCurrent ? 'bg-[linear-gradient(90deg,rgba(83,76,205,0.2)_0%,rgba(83,76,205,0.08)_100%)] text-white' : 'text-[#9ca2be] hover:bg-[#161a30] hover:text-white')}
                      onClick={() => {
                        setOpen(false);
                        navigate(`/servers/${s.id}`);
                      }}
                    >
                      <ServerGlyph server={s} size={28} />
                      <div className="flex-1 min-w-0">
                        <span className="block text-[0.9rem] font-medium truncate leading-tight">{s.name}</span>
                        <span className="block text-[0.68rem] text-[#555b78] leading-tight mt-0.5">{s.memberCount.toLocaleString('de-DE')} Mitglieder</span>
                      </div>
                      {isCurrent && <span className="text-[0.72rem] text-[#b4adff]">Aktuell</span>}
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="text-[#555b78] text-[0.82rem] text-center py-4">Kein Server gefunden.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="ml-auto" />
      </div>
    </header>
  );
};

export default ServerHeader;
