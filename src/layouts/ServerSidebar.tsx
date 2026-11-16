import React from 'react';
import { Layers, FileText, BarChart3, Shield, Home, Cog } from 'lucide-react';
import { NavLink, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

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
          'flex items-center gap-3 px-4 h-11 rounded-xl transition-colors border',
          isActive
            ? 'bg-[linear-gradient(90deg,rgba(83,76,205,0.6)_0%,rgba(83,76,205,0.3)_100%)] border-[#5f58d8] text-white shadow-[0_10px_26px_-18px_rgba(75,70,200,0.92)]'
            : 'text-[#acb3cf] border-transparent hover:text-[#f0f2ff] hover:bg-layout-hover hover:border-layout-divider'
        )
      }
      end
    >
      <Icon className="w-5 h-5 text-[#9ea7c6]" />
      <span className="text-[1.02rem] font-medium">{label}</span>
    </NavLink>
  );
};

export const ServerSidebar: React.FC<ServerSidebarProps> = ({ open, onClose }) => {
  const { guildId } = useParams();
  const base = `/servers/${guildId}`;

  return (
    <aside
      className={cn(
        'w-[260px] lg:w-[278px] h-screen bg-layout-sidebar/98 border-r border-layout-divider flex flex-col fixed left-0 top-0 z-[55] transition-transform duration-300 lg:translate-x-0 backdrop-blur-xl shadow-[20px_0_44px_-28px_rgba(0,0,0,0.95)]',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="px-5 pt-5 pb-3 min-h-[66px] border-b border-layout-divider/70">
        <p className="text-[#a0a6c3] text-[0.84rem] font-semibold">Serververwaltung</p>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div className="space-y-2">
          <p className="px-2 text-[0.72rem] font-semibold text-[#7f89aa] uppercase tracking-[0.08em]">Allgemein</p>
          <NavItem to={base} icon={Home} label="Übersicht" onClick={onClose} />
          <NavItem to={`${base}/settings`} icon={Cog} label="Einstellungen" onClick={onClose} />
          <NavItem to={`${base}/modules`} icon={Layers} label="Module" onClick={onClose} />
        </div>
        <div className="space-y-2">
          <p className="px-2 text-[0.72rem] font-semibold text-[#7f89aa] uppercase tracking-[0.08em]">Administration</p>
          <NavItem to={`${base}/permissions`} icon={Shield} label="Berechtigungen" onClick={onClose} />
          <NavItem to={`${base}/logs`} icon={FileText} label="Logs" onClick={onClose} />
          <NavItem to={`${base}/stats`} icon={BarChart3} label="Statistiken" onClick={onClose} />
        </div>
      </div>
    </aside>
  );
};

export default ServerSidebar;
