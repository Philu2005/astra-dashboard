import { Menu, X, ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AstraLogo } from '@/components/AstraLogo';
import { cn } from '@/lib/utils';
import { ctaLinks } from '@/lib/landing-content';
import { withFrom } from '@/lib/returnTo';

const buttonPrimary =
  'inline-flex items-center justify-center gap-2.5 rounded-xl border border-[#7770f5] bg-[linear-gradient(138deg,#6662e8_0%,#4b46c8_52%,#b14fff_100%)] px-5 py-2.5 text-sm font-semibold text-white tracking-wide transition-all duration-300 hover:-translate-y-0.5 hover:border-[#9f95ff] hover:shadow-[0_14px_28px_-16px_rgba(168,85,247,0.9)]';
const buttonSecondary =
  'inline-flex items-center justify-center gap-2.5 rounded-xl border border-layout-divider bg-layout-topbar/70 px-5 py-2.5 text-sm font-semibold text-[#d7ddf2] tracking-wide transition-all duration-300 hover:border-[#5d649b] hover:bg-layout-hover hover:-translate-y-0.5';

interface NavItem {
  label: string;
  href: string;
}

interface SharedNavbarProps {
  activeRoute?: string;
  /**
   * Visuelle Variante der Navbar.
   * - "landing": Vollständige Landingpage-Navigation mit Menüpunkten und Aktionsbuttons
   * - "subpage": Reduzierte Unterseiten-Navigation (kein zentrales Menü, keine Aktionsbuttons)
   */
  variant?: 'landing' | 'subpage';
  /** Optionale linke Slot-Fläche (z. B. Zurück-Button + Seitentitel) */
  customLeftContent?: React.ReactNode;
  /** Optionale rechte Slot-Fläche (z. B. Suche, Filter, etc.) */
  customRightContent?: React.ReactNode;
  /**
   * Optionaler Zurück-Button nur für Subpages. Wenn gesetzt, wird links ein
   * eigenständiger Button mit Icon und Label angezeigt.
   */
  showBackButton?: boolean;
  /** Zielpfad für den Zurück-Button (muss interner Pfad sein, z. B. "/" oder "/dashboard"). */
  backTo?: string;
  /** Beschriftung für den Zurück-Button (Default: "Zurück"). */
  backLabel?: string;
}

export const SharedNavbar = ({ activeRoute, variant = 'landing', customLeftContent, customRightContent, showBackButton, backTo = '/', backLabel = 'Zurück' }: SharedNavbarProps) => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { authenticated, loading: authLoading, user } = useAuth();
  const isAdmin = user?.id === '789555434201677824';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems: NavItem[] = [
    { label: 'Start', href: '/' },
    { label: 'Features', href: '/#features' },
    { label: 'Dokumentation', href: '/docs' },
    { label: 'Status', href: '/status' },
    { label: 'Support', href: '/support' },
  ];

  const isLinkActive = (href: string) => {
    if (activeRoute === href) return true;
    if (href !== '/' && activeRoute?.startsWith(href)) return true;
    return false;
  };

  // Aktueller Pfad (für from-Weitergabe bei Landing-Navigation)
  const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-layout-divider backdrop-blur-lg transition-all duration-300',
        scrolled
          ? 'translate-y-0 bg-[#121524]/92 shadow-[0_20px_36px_-30px_rgba(12,18,36,0.95)]'
          : 'translate-y-0 bg-[#0f1220]/80',
      )}
    >
      <nav className="mx-auto flex w-full max-w-[1380px] items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          {variant === 'subpage' && showBackButton && (
            <a
              href={backTo || '/'}
              className="inline-flex items-center gap-2 rounded-xl border border-[#2a2f47] bg-layout-topbar/70 px-3.5 py-2 text-[0.92rem] font-medium text-[#d7ddf2] transition-all duration-200 hover:border-[#5d649b] hover:bg-layout-hover focus:outline-none focus:ring-2 focus:ring-[#4b46c8]/50"
              aria-label="Zurück"
            >
              <ChevronLeft className="w-4.5 h-4.5" />
              {backLabel}
            </a>
          )}

          {variant === 'subpage' && showBackButton && (
            <div className="hidden lg:block h-6 w-px bg-layout-divider" />
          )}

          <a href={ctaLinks.home} className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-[38px] h-[38px] bg-[#4b46c8] rounded-xl shadow-astra-glow border border-[#5f5ad6]/20 overflow-hidden shrink-0 transition-transform group-hover:scale-105">
              <AstraLogo size={34} glow="soft" fill className="scale-[1.18]" alt="Astra" />
            </div>
            <div>
              <p className="text-xl font-semibold leading-none tracking-[-0.02em] text-white">Astra</p>
              <p className="text-[0.78rem] font-medium leading-none text-[#a6adca]">Discord Bot</p>
            </div>
          </a>

          {customLeftContent && (
            <div className="hidden items-center lg:flex pl-4 ml-1">
              {customLeftContent}
            </div>
          )}
        </div>

        {variant === 'landing' && (
        <div className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => {
            const active = isLinkActive(item.href);
            const href = (item.href === '/docs' || item.href === '/status')
              ? withFrom(item.href, currentPath)
              : item.href;
            return (
              <a
                key={item.label}
                href={href}
                className={cn(
                  'relative text-[0.96rem] font-medium transition-all duration-200 py-1 px-1',
                  active
                    ? 'text-white'
                    : 'text-[#bcc3df] hover:text-white',
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-gradient-to-r from-[#4b46c8] to-[#7de3ff] rounded-full" />
                )}
              </a>
            );
          })}
        </div>
        )}

        <div className="hidden items-center gap-3 lg:flex">
          {customRightContent}
          {variant === 'landing' && (
            <>
              {!isAdmin && (
                <a href="/support" className={buttonSecondary}>Support</a>
              )}
              <a href={ctaLinks.invite} className={buttonSecondary}>Astra einladen</a>
              {!authLoading && (
                authenticated
                  ? <a href={ctaLinks.dashboard} className={buttonPrimary}>Dashboard</a>
                  : <a href={ctaLinks.login} className={buttonPrimary}>Login</a>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          {customRightContent}
          {variant === 'landing' && (
            <button
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-layout-divider bg-layout-topbar text-[#cfd4ec]"
              onClick={() => setOpen((value) => !value)}
              aria-label="Navigation öffnen"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </nav>

      {variant === 'landing' && open && (
        <div className="border-t border-layout-divider bg-[#0f1220] px-4 pb-5 pt-4 lg:hidden">
          <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const href = (item.href === '/docs' || item.href === '/status')
                  ? withFrom(item.href, currentPath)
                  : item.href;
                return (
                <a
                  key={item.label}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'rounded-xl border px-4 py-2.5 text-[#d7ddf2] transition-colors',
                    isLinkActive(item.href)
                      ? 'bg-[#4b46c8]/20 border-[#4b46c8]/40 text-white'
                      : 'bg-layout-topbar/70 border-layout-divider'
                  )}
                >
                  {item.label}
                </a>
              );
            })}
            {!isAdmin && (
              <a href="/support" onClick={() => setOpen(false)} className="rounded-xl border border-layout-divider bg-layout-topbar/70 px-4 py-2.5 text-[#d7ddf2]">Support</a>
            )}
            {!authLoading && (
              authenticated
                ? <a href={ctaLinks.dashboard} className={cn(buttonPrimary, 'mt-2')}>Dashboard</a>
                : <a href={ctaLinks.login} className={cn(buttonPrimary, 'mt-2')}>Login</a>
            )}
            <a href={ctaLinks.invite} className={buttonSecondary}>Astra einladen</a>
          </div>
        </div>
      )}
    </header>
  );
};
