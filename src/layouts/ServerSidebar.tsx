import React from 'react';
import { Layers, FileText, BarChart3, Shield, Home, Cog, ArrowLeft } from 'lucide-react';
import { NavLink, useParams, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { categories, modulesRegistry } from '@/modules/registry';
import { AstraLogo } from '@/components/AstraLogo';
import { useBotStatus, botStatusConfig } from '@/hooks/useBotStatus';
import { appConfig } from '@/lib/app-config';

interface ServerSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const NavItem: React.FC<{ to: string; icon: React.ElementType; label: string; onClick?: () => void }> = ({ to, icon: Icon, label, onClick }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-4 h-11 rounded-xl transition-all duration-200 border',
          isActive
            ? 'bg-[linear-gradient(90deg,rgba(83,76,205,0.6)_0%,rgba(83,76,205,0.3)_100%)] border-[#5f58d8] text-white shadow-[0_10px_26px_-18px_rgba(75,70,200,0.92)]'
            : 'text-[#acb3cf] border-transparent hover:text-[#f0f2ff] hover:bg-layout-hover hover:border-layout-divider'
        )
      }
      end
    >
      <Icon className={cn('w-5 h-5 text-[#9ea7c6]')} strokeWidth={2} />
      <span className="text-[1rem] sm:text-[1.06rem] lg:text-[1.12rem] font-medium leading-none">{label}</span>
    </NavLink>
  );
};

export const ServerSidebar: React.FC<ServerSidebarProps> = ({ open, onClose }) => {
  const { guildId } = useParams();
  const base = `/servers/${guildId}`;
  const botStatus = useBotStatus();
  const sidebarStatusConfig = botStatusConfig[botStatus];
  const inviteUrl = appConfig.botInviteUrl;

  return (
    <aside
      className={cn(
        'w-[278px] h-screen bg-layout-sidebar/98 border-r border-layout-divider flex flex-col fixed left-0 top-0 z-[65] transition-transform duration-300 lg:translate-x-0 backdrop-blur-xl shadow-[20px_0_44px_-28px_rgba(0,0,0,0.95)]',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Branding – identisch zur GlobalSidebar */}
      <Link to="/dashboard" className="px-6 lg:px-8 pt-5 pb-4 flex items-center gap-4 min-h-[78px] border-b border-layout-divider group hover:bg-layout-hover/40 transition-colors">
        <div className="relative flex items-center justify-center w-[56px] h-[56px] bg-[#463fb9] rounded-2xl shadow-astra-glow border border-[#4f4ab6]/45 overflow-hidden shrink-0">
          <AstraLogo size={56} glow="soft" fill className="scale-[1.18]" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-[2.1rem] leading-none tracking-[-0.02em]">Astra</h1>
          <p className="text-[#a0a6c3] text-[1.12rem] font-medium leading-none -mt-0.5">Dashboard</p>
        </div>
        <ArrowLeft className="w-4 h-4 text-[#7f89aa] group-hover:text-white transition-colors shrink-0 opacity-0 group-hover:opacity-100" />
      </Link>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 space-y-7 pt-3 pb-6">
        <div className="space-y-2">
          <p className="px-4 text-[0.72rem] sm:text-[0.68rem] font-semibold text-[#7f89aa] uppercase tracking-[0.08em] mb-3">
            Serververwaltung
          </p>
          <div className="space-y-1">
            <NavItem to={base} icon={Home} label="Übersicht" onClick={onClose} />
            <NavItem to={`${base}/settings`} icon={Cog} label="Einstellungen" onClick={onClose} />
            <NavItem to={`${base}/modules`} icon={Layers} label="Module" onClick={onClose} />
          </div>
        </div>

        <div className="space-y-2">
          <p className="px-4 text-[0.72rem] sm:text-[0.68rem] font-semibold text-[#7f89aa] uppercase tracking-[0.08em] mb-3">
            Administration
          </p>
          <div className="space-y-1">
            <NavItem to={`${base}/permissions`} icon={Shield} label="Berechtigungen" onClick={onClose} />
            <NavItem to={`${base}/logs`} icon={FileText} label="Logs" onClick={onClose} />
            <NavItem to={`${base}/stats`} icon={BarChart3} label="Statistiken" onClick={onClose} />
          </div>
        </div>

        {/* Module-Schnellauswahl aus Registry */}
        <div className="space-y-2">
          <p className="px-4 text-[0.72rem] sm:text-[0.68rem] font-semibold text-[#7f89aa] uppercase tracking-[0.08em] mb-3">
            Module
          </p>
          <div className="space-y-1">
            {categories
              .filter((c) => c.id !== 'all')
              .map((cat) => {
                const items = modulesRegistry.filter((m) => m.category === cat.id);
                if (items.length === 0) return null;
                return (
                  <React.Fragment key={cat.id}>
                    {items.map((m) => (
                      <NavItem
                        key={m.key}
                        to={m.buildPath(String(guildId))}
                        icon={m.icon as any}
                        label={m.name}
                        onClick={onClose}
                      />
                    ))}
                  </React.Fragment>
                );
              })}
          </div>
        </div>
      </div>

      {/* Footer – identisch zur GlobalSidebar */}
      <div className="px-5 py-5 border-t border-layout-divider space-y-4 bg-[linear-gradient(180deg,rgba(15,15,27,0)_0%,rgba(15,15,27,0.52)_100%)]">
        <a
          href={inviteUrl || '#'}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!inviteUrl}
          title={inviteUrl ? 'Astra Bot einladen' : 'Invite-URL fehlt: VITE_BOT_INVITE_URL setzen'}
          className={cn(
            'w-full inline-flex items-center justify-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-[0.85rem] font-semibold tracking-wide transition-all duration-300 border-[#6861e1] bg-[linear-gradient(138deg,#6460e6_0%,#4b46c8_58%,#3e3aa2_100%)] text-white shadow-[0_14px_34px_-22px_rgba(92,84,219,0.98),0_0_0_1px_rgba(158,153,255,0.18)_inset]',
            inviteUrl ? 'hover:translate-y-[-1px] hover:scale-[1.01] hover:border-[#8881ff] hover:shadow-[0_20px_38px_-22px_rgba(110,100,255,1),0_0_0_1px_rgba(178,172,255,0.26)_inset] active:translate-y-0 active:scale-[0.985]' : 'opacity-80 cursor-not-allowed'
          )}
        >
          Astra einladen
        </a>
        <div className="flex items-center justify-between rounded-xl border border-layout-divider bg-layout-hover px-3 py-2.5 text-[11px] text-[#9ca2be]">
          <span className="font-semibold">v3.2.0</span>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${sidebarStatusConfig.dotColor}`} />
            <span className="font-medium text-[#c9cedf]">{sidebarStatusConfig.labelShort || 'Lade…'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ServerSidebar;
