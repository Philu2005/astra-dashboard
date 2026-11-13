import { Bell, ChevronDown, Link2, LogOut, User } from 'lucide-react';
import { appConfig } from '@/lib/app-config';
import { useAuth } from '@/contexts/AuthContext';
import { useConsent } from '@/contexts/ConsentContext';
import { useState, useRef, useEffect } from 'react';

const inviteUrl = appConfig.botInviteUrl;

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden="true" fill="currentColor">
    <path d="M20.317 4.37a19.8 19.8 0 0 0-4.885-1.515.074.074 0 0 0-.078.037c-.211.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.487 0 12.66 12.66 0 0 0-.617-1.249.078.078 0 0 0-.078-.037 19.74 19.74 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.06 13.06 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.095.252-.195.372-.295a.074.074 0 0 1 .078-.011c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.01c.12.1.246.2.373.296a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.076.076 0 0 0-.04.107c.36.698.772 1.363 1.225 1.993a.077.077 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .03-.055c.5-5.177-.838-9.674-3.549-13.66a.062.062 0 0 0-.031-.03ZM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.956 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.947 2.419-2.157 2.419Z" />
  </svg>
);

export const Topbar = () => {
  const { user, logout } = useAuth();
  const { openSettings } = useConsent();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-[78px] flex items-center justify-end px-4 sm:px-6 lg:px-8 xl:px-10 gap-2.5 sm:gap-3 lg:gap-4 z-40 bg-layout-topbar/88 backdrop-blur-md border-b border-layout-divider sticky top-0">
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
        }}
        className={`inline-flex items-center gap-2.5 rounded-xl border px-3 sm:px-3.5 py-2.5 text-[0.8rem] sm:text-[0.85rem] font-semibold tracking-wide transition-all duration-300 border-[#6861e1] bg-[linear-gradient(138deg,#6460e6_0%,#4b46c8_58%,#3e3aa2_100%)] text-white shadow-[0_14px_34px_-22px_rgba(92,84,219,0.98),0_0_0_1px_rgba(158,153,255,0.18)_inset] ${
          inviteUrl
            ? 'hover:translate-y-[-1px] hover:scale-[1.015] hover:border-[#8881ff] hover:shadow-[0_20px_38px_-22px_rgba(110,100,255,1),0_0_0_1px_rgba(178,172,255,0.26)_inset] active:translate-y-0 active:scale-[0.985]'
            : 'opacity-80 cursor-not-allowed'
        }`}
      >
        {inviteUrl ? <DiscordIcon /> : <Link2 className="w-4 h-4" />}
        <span className="hidden sm:inline">Astra einladen</span>
        <span className="sm:hidden">Invite</span>
      </a>

      {/* Notifications */}
      <button className="relative p-2.5 rounded-lg text-[#a2a8c2] hover:text-white hover:bg-layout-hover transition-all duration-300 cursor-pointer group border border-transparent hover:border-layout-divider">
        <Bell className="w-5 h-5" strokeWidth={2} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-astra-purple rounded-full border-2 border-[#0f1220] shadow-[0_0_10px_rgba(75,70,200,0.75)]" />
      </button>

      {/* User Profile */}
      <div 
        ref={dropdownRef}
        className="relative flex items-center gap-3 lg:gap-4 pl-3 lg:pl-4 border-l border-layout-divider cursor-pointer group h-full"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <div className="text-right hidden sm:block">
          <p className="text-[0.98rem] font-semibold text-white leading-none group-hover:text-astra-cyan transition-colors">
            {user?.display_name || 'Lädt...'}
          </p>
          <p className="text-[0.8rem] text-[#9299b4] font-medium tracking-wide leading-none mt-1">
            {user?.username ? `@${user.username}` : ''}
          </p>
        </div>
        <div className="relative">
          <img 
            src={user?.avatar_url || "https://github.com/shadcn.png"} 
            alt="User Avatar" 
            className="w-11 h-11 rounded-full object-cover ring-2 ring-transparent group-hover:ring-astra-purple/45 transition-all duration-300 shadow-[0_8px_22px_-8px_rgba(0,0,0,0.8)]"
          />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0f1220] shadow-[0_0_8px_rgba(74,222,128,0.7)]" />
        </div>
        <ChevronDown className={`w-4 h-4 text-[#8f95b1] group-hover:text-white transition-all duration-300 hidden sm:block ${dropdownOpen ? 'rotate-180' : ''}`} />

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute top-[calc(100%-10px)] right-0 w-48 bg-[#161a2d] border border-layout-divider rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-2 border-b border-layout-divider mb-1 sm:hidden">
              <p className="text-sm font-semibold text-white truncate">{user?.display_name}</p>
              <p className="text-xs text-[#9299b4] truncate">@{user?.username}</p>
            </div>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-[0.9rem] text-[#a2a8c2] hover:text-white hover:bg-layout-hover transition-colors text-left">
              <User className="w-4 h-4" />
              Profil
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen(false);
                openSettings();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[0.9rem] text-[#a2a8c2] hover:text-white hover:bg-layout-hover transition-colors text-left"
            >
              <User className="w-4 h-4" />
              Cookie-Einstellungen
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[0.9rem] text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              Abmelden
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
