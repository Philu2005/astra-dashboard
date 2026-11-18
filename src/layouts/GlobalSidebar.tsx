import React from 'react';
import {
  Home,
  Server as ServerIcon,
  Headset,
  BookOpen,
  Activity,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { withFrom } from '@/lib/returnTo';
import { appConfig } from '@/lib/app-config';
import { AstraLogo } from '@/components/AstraLogo';
import { useBotStatus, botStatusConfig } from '@/hooks/useBotStatus';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '@/contexts/SidebarContext';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  external?: boolean;
  href?: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, active, external, href }) => {
  const content = (
    <div
      className={cn(
        'flex items-center gap-3 px-4 h-11 rounded-xl cursor-pointer transition-all duration-200 group border',
        active
          ? 'bg-[linear-gradient(90deg,rgba(83,76,205,0.6)_0%,rgba(83,76,205,0.3)_100%)] border-[#5f58d8] text-white shadow-[0_10px_26px_-18px_rgba(75,70,200,0.92)]'
          : 'text-[#acb3cf] border-transparent hover:text-[#f0f2ff] hover:bg-layout-hover hover:border-layout-divider'
      )}
    >
      <Icon className={cn('w-5 h-5', active ? 'text-[#cbc3ff]' : 'text-[#9ea7c6] group-hover:text-[#cbc3ff]')} strokeWidth={2} />
      <span className="text-[1rem] sm:text-[1.06rem] lg:text-[1.12rem] font-medium flex-1 leading-none">{label}</span>
      {external && <ExternalLink className="w-3.5 h-3.5 opacity-50" />}
    </div>
  );

  if (!href) return content;
  if (external) return (
    <a href={href} target="_blank" rel="noreferrer">
      {content}
    </a>
  );
  return (
    <Link to={href}>
      {content}
    </Link>
  );
};

export const GlobalSidebar: React.FC = () => {
  const botStatus = useBotStatus();
  const sidebarStatusConfig = botStatusConfig[botStatus];
  const { user } = useAuth();
  const isAdmin = user?.id === '789555434201677824';
  const location = useLocation();
  const { isOpen, isDesktop } = useSidebar();

  const inviteUrl = appConfig.botInviteUrl;

  return (
    <aside
      className={cn(
        'w-[278px] h-screen bg-layout-sidebar/98 border-r border-layout-divider flex flex-col fixed left-0 top-0 z-[65] backdrop-blur-xl shadow-[20px_0_44px_-28px_rgba(0,0,0,0.95)] transition-transform duration-300',
        isDesktop ? 'translate-x-0' : (isOpen ? 'translate-x-0' : '-translate-x-full')
      )}
      aria-hidden={!isDesktop && !isOpen}
    >
      {/* Branding */}
      <div className="px-6 lg:px-8 pt-5 pb-4 flex items-center gap-4 min-h-[78px] border-b border-layout-divider">
        <div className="relative flex items-center justify-center w-[56px] h-[56px] bg-[#463fb9] rounded-2xl shadow-astra-glow border border-[#4f4ab6]/45 overflow-hidden shrink-0">
          <AstraLogo size={56} glow="soft" fill className="scale-[1.18]" />
        </div>
        <div>
          <h1 className="text-white font-bold text-[2.1rem] leading-none tracking-[-0.02em]">Astra</h1>
          <p className="text-[#a0a6c3] text-[1.12rem] font-medium leading-none -mt-0.5">Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 space-y-7 pt-3 pb-6">
        <div className="space-y-1">
          <NavItem icon={Home} label="Übersicht" active={location.pathname === '/dashboard'} href="/dashboard" />
        </div>

        <div className="space-y-2">
          <p className="px-4 text-[0.72rem] sm:text-[0.68rem] font-semibold text-[#7f89aa] uppercase tracking-[0.08em] mb-3">
            Allgemein
          </p>
          <div className="space-y-1">
            <NavItem icon={ServerIcon} label="Meine Server" active={location.pathname === '/servers' || location.pathname.startsWith('/servers/')} href="/servers" />
            {!isAdmin && (
              <NavItem icon={Headset} label="Support" active={location.pathname === '/support' || location.pathname.startsWith('/support/ticket/')} href="/support" />
            )}
            <NavItem icon={BookOpen} label="Dokumentation" href={withFrom('/docs', location.pathname)} />
            <NavItem icon={Activity} label="Status" href={withFrom('/status', location.pathname)} />
            {isAdmin && (
              <NavItem icon={FileText} label="Support-Tickets" active={location.pathname === '/dashboard/tickets'} href="/dashboard/tickets" />
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
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

export default GlobalSidebar;
