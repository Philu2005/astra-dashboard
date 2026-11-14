import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Layers,
  FileText,
  BarChart3, 
  Server, 
  Headset, 
  BookOpen,
  ExternalLink,
  ChevronDown,
  Home,
  Cog,
  Shield,
  Menu,
  Check,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { appConfig } from '@/lib/app-config';
import { AstraLogo } from '@/components/AstraLogo';
import { useServerContext, iconColors } from '@/contexts/ServerContext';
import { useBotStatus, botStatusConfig } from '@/hooks/useBotStatus';

const inviteUrl = appConfig.botInviteUrl;

const ServerIcon = ({ server, size = 'sm', colorClass }: { server: { icon: string | null; initials: string; name: string }; size?: 'sm' | 'md'; colorClass: string }) => {
  const [imgError, setImgError] = useState(false);
  const handleError = useCallback(() => setImgError(true), []);

  const dims = size === 'md' ? 'w-8 h-8' : 'w-7 h-7';
  const textSize = size === 'md' ? 'text-[11px]' : 'text-[10px]';

  if (server.icon && !imgError) {
    return (
      <img
        src={server.icon}
        alt={server.name}
        onError={handleError}
        className={cn(dims, 'rounded-lg object-cover shrink-0 ring-1 ring-white/10')}
        loading="lazy"
      />
    );
  }

  return (
    <div className={cn(dims, 'rounded-lg flex items-center justify-center font-bold text-white shrink-0 ring-1 ring-white/10', textSize, colorClass)}>
      {server.initials}
    </div>
  );
};

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  external?: boolean;
  href?: string;
  onClick?: () => void;
}

const NavItem = ({ icon: Icon, label, active, external, href, onClick }: NavItemProps) => {
  const handleClick = () => {
    if (href && !external) {
      window.location.href = href;
    }
    onClick?.();
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-center gap-3 px-4 h-11 rounded-xl cursor-pointer transition-all duration-200 group border",
        active 
          ? "bg-[linear-gradient(90deg,rgba(83,76,205,0.6)_0%,rgba(83,76,205,0.3)_100%)] border-[#5f58d8] text-white shadow-[0_10px_26px_-18px_rgba(75,70,200,0.92)]" 
          : "text-[#acb3cf] border-transparent hover:text-[#f0f2ff] hover:bg-layout-hover hover:border-layout-divider"
      )}
    >
      <Icon className={cn("w-5 h-5", active ? "text-[#cbc3ff]" : "text-[#9ea7c6] group-hover:text-[#cbc3ff]")} strokeWidth={2} />
      <span className="text-[1rem] sm:text-[1.06rem] lg:text-[1.12rem] font-medium flex-1 leading-none">{label}</span>
      {external && <ExternalLink className="w-3.5 h-3.5 opacity-50" />}
    </div>
  );
};

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [serverSearch, setServerSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = typeof window !== 'undefined' ? window.location.pathname.replace(/\/+$/, '') || '/' : '/';
  const { servers, selectedServer, selectServer } = useServerContext();
  const botStatus = useBotStatus();
  const sidebarStatusConfig = botStatusConfig[botStatus];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "lg:hidden fixed top-4 left-4 z-[70] p-3 rounded-xl border text-white shadow-[0_12px_28px_-16px_rgba(0,0,0,0.95)] transition-all duration-300 bg-layout-sidebar/96 border-layout-divider backdrop-blur-md",
          isOpen ? "opacity-0 scale-90 pointer-events-none" : "opacity-100 scale-100 active:scale-95"
        )}
        aria-label="Navigation öffnen"
        aria-hidden={isOpen}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-[#050711]/74 backdrop-blur-[2px] z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "w-[278px] h-screen bg-layout-sidebar/98 border-r border-layout-divider flex flex-col fixed left-0 top-0 z-[65] transition-transform duration-300 lg:translate-x-0 backdrop-blur-xl shadow-[20px_0_44px_-28px_rgba(0,0,0,0.95)]",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
      {/* Branding */}
        <div className="px-6 lg:px-8 pt-5 pb-4 flex items-center gap-4 min-h-[78px] border-b border-layout-divider lg:border-b-0">
          <button
            onClick={() => setIsOpen(false)}
            className={cn(
              "lg:hidden p-3 rounded-xl border text-white shadow-[0_12px_28px_-16px_rgba(0,0,0,0.95)] transition-all duration-300 bg-layout-sidebar/96 border-layout-divider backdrop-blur-md flex items-center justify-center",
              isOpen ? "opacity-100 scale-100 delay-300" : "opacity-0 scale-90 pointer-events-none"
            )}
            aria-label="Navigation schließen"
          >
            <Menu className="w-6 h-6" />
          </button>
      <div className="flex items-center gap-4 min-w-0">
            <div className="relative flex items-center justify-center w-[56px] h-[56px] bg-[#463fb9] rounded-2xl shadow-astra-glow border border-[#4f4ab6]/45 overflow-hidden shrink-0">
              <AstraLogo size={56} glow="soft" fill className="scale-[1.18]" />
            </div>
            <div>
              <h1 className="text-white font-bold text-[2.1rem] leading-none tracking-[-0.02em]">Astra</h1>
              <p className="text-[#a0a6c3] text-[1.12rem] font-medium leading-none -mt-0.5">Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation Scroll Area */}
        <div className="flex-1 overflow-y-auto px-4 space-y-7 pt-3 pb-6 border-t-0">
          {/* Main */}
          <div>
            <NavItem icon={Home} label="Übersicht" active={pathname === '/dashboard'} href="/dashboard" onClick={() => setIsOpen(false)} />
          </div>

          {/* Server Management */}
          <div className="space-y-2">
            <p className="px-4 text-[0.72rem] sm:text-[0.68rem] font-semibold text-[#7f89aa] uppercase tracking-[0.08em] mb-3">
              Serververwaltung
            </p>
            <div className="px-1 mb-4 relative" ref={dropdownRef}>
              <button
                onClick={() => { setDropdownOpen((prev) => !prev); setServerSearch(''); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 h-12 rounded-xl text-sm text-white transition-all duration-300 border",
                  dropdownOpen
                    ? "bg-[linear-gradient(135deg,rgba(83,76,205,0.25)_0%,rgba(83,76,205,0.1)_100%)] border-[#5f58d8] shadow-[0_0_20px_-8px_rgba(99,91,224,0.4)]"
                    : "bg-[#13162a] border-[#2a2f45] hover:border-[#3d4260] hover:bg-[#161a30] shadow-[0_8px_20px_-16px_rgba(0,0,0,0.8)]"
                )}
              >
                {selectedServer ? (
                  <ServerIcon server={selectedServer} size="md" colorClass={iconColors[servers.indexOf(selectedServer) % iconColors.length]} />
                ) : (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.5)] ring-1 ring-white/10 bg-astra-purple">
                    ??
                  </div>
                )}
                <div className="flex-1 min-w-0 text-left">
                  <span className="block font-semibold text-[0.92rem] truncate leading-tight">{selectedServer?.name ?? 'Server wählen'}</span>
                  <span className="block text-[0.7rem] text-[#6b7194] leading-tight mt-0.5">
                    {selectedServer ? 'Astra aktiv' : 'Server auswählen'}
                  </span>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-[#6b7194] transition-transform duration-300", dropdownOpen && "rotate-180")} />
              </button>
              {dropdownOpen && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-xl border border-[#2e334a] bg-[#111425] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.03)_inset] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Search */}
                  <div className="p-2.5 border-b border-[#1e2238]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b7194] pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Server suchen..."
                        value={serverSearch}
                        onChange={(e) => setServerSearch(e.target.value)}
                        autoFocus
                        className="w-full h-9 pl-9 pr-3 bg-[#0d0f1e] border border-[#252940] rounded-lg text-white text-[0.82rem] placeholder:text-[#4a5070] focus:outline-none focus:border-[#5f58d8]/50 transition-colors duration-200"
                      />
                    </div>
                  </div>
                  {/* Server list */}
                  <div className="py-1.5 max-h-[260px] overflow-y-auto scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {servers
                      .filter((s) => s.name.toLowerCase().includes(serverSearch.toLowerCase()))
                      .map((server, idx) => {
                        const isSelected = server.id === selectedServer?.id;
                        const originalIdx = servers.indexOf(server);
                        return (
                          <button
                            key={server.id}
                            onClick={() => {
                              selectServer(server.id);
                              setDropdownOpen(false);
                              setServerSearch('');
                              if (window.location.pathname.replace(/\/+$/, '') !== '/servers') {
                                window.location.href = '/servers';
                              }
                            }}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-200 mx-0 group/item",
                              isSelected
                                ? "bg-[linear-gradient(90deg,rgba(83,76,205,0.2)_0%,rgba(83,76,205,0.08)_100%)] text-white"
                                : "text-[#9ca2be] hover:bg-[#161a30] hover:text-white"
                            )}
                          >
                            <div className="shrink-0 transition-transform duration-200 group-hover/item:scale-110">
                              <ServerIcon server={server} size="sm" colorClass={iconColors[originalIdx % iconColors.length]} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block text-[0.88rem] font-medium truncate leading-tight">{server.name}</span>
                              <span className="block text-[0.68rem] text-[#555b78] leading-tight mt-0.5">
                                {server.memberCount.toLocaleString('de-DE')} Mitglieder
                              </span>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-md bg-[rgba(83,76,205,0.35)] flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 text-[#b4adff]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    {servers.filter((s) => s.name.toLowerCase().includes(serverSearch.toLowerCase())).length === 0 && (
                      <p className="text-[#555b78] text-[0.82rem] text-center py-4">Kein Server gefunden.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <NavItem icon={Cog} label="Konfiguration" onClick={() => setIsOpen(false)} />
              <NavItem icon={Layers} label="Module" onClick={() => setIsOpen(false)} />
              <NavItem icon={Shield} label="Berechtigungen" onClick={() => setIsOpen(false)} />
              <NavItem icon={FileText} label="Logs" onClick={() => setIsOpen(false)} />
              <NavItem icon={BarChart3} label="Statistiken" onClick={() => setIsOpen(false)} />
            </div>
          </div>

          {/* General */}
          <div className="space-y-2">
            <p className="px-4 text-[0.72rem] sm:text-[0.68rem] font-semibold text-[#7f89aa] uppercase tracking-[0.08em] mb-3">
              Allgemein
            </p>
            <div className="space-y-1">
              <NavItem icon={Server} label="Meine Server" active={pathname === '/servers'} href="/servers" onClick={() => setIsOpen(false)} />
              <NavItem icon={Headset} label="Support" onClick={() => setIsOpen(false)} />
              <NavItem icon={BookOpen} label="Dokumentation" href="/docs" onClick={() => setIsOpen(false)} />
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="px-5 py-5 border-t border-layout-divider space-y-4 bg-[linear-gradient(180deg,rgba(15,15,27,0)_0%,rgba(15,15,27,0.52)_100%)]">
          <a
            href={inviteUrl || '#'}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!inviteUrl}
            title={inviteUrl ? 'Astra Bot einladen' : 'Invite-URL fehlt: VITE_BOT_INVITE_URL setzen'}
            onClick={(event) => {
              if (!inviteUrl) {
                event.preventDefault();
              }
              setIsOpen(false);
            }}
            className={cn(
              "lg:hidden w-full inline-flex items-center justify-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-[0.85rem] font-semibold tracking-wide transition-all duration-300 border-[#6861e1] bg-[linear-gradient(138deg,#6460e6_0%,#4b46c8_58%,#3e3aa2_100%)] text-white shadow-[0_14px_34px_-22px_rgba(92,84,219,0.98),0_0_0_1px_rgba(158,153,255,0.18)_inset]",
              inviteUrl
                ? "hover:translate-y-[-1px] hover:scale-[1.01] hover:border-[#8881ff] hover:shadow-[0_20px_38px_-22px_rgba(110,100,255,1),0_0_0_1px_rgba(178,172,255,0.26)_inset] active:translate-y-0 active:scale-[0.985]"
                : "opacity-80 cursor-not-allowed"
            )}
          >
            Astra einladen
          </a>
          <div className="flex items-center justify-between rounded-xl border border-layout-divider bg-layout-hover px-3 py-2.5 text-[11px] text-[#9ca2be]">
            <span className="font-semibold">v3.2.0</span>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${sidebarStatusConfig.dotColor}`} />
              <span className="font-medium text-[#c9cedf]">{sidebarStatusConfig.labelShort || 'Lade\u2026'}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
