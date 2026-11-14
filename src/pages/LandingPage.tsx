import { ArrowRight, Check, Menu, Monitor, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import dashboardPreviewImage from '../../docs/design/astra-dashboard-preview-rounded.png';
import { AstraLogo } from '@/components/AstraLogo';
import { AstraHeroProductDemo } from '@/components/landing/AstraHeroProductDemo';
import { CookieSettingsTrigger } from '@/components/consent/CookieSettingsTrigger';
import { cn } from '@/lib/utils';
import {
  ctaLinks,
  dashboardBenefits,
  footerSocialLinks,
  footerGroups,
  heroBadge,
  landingFeatures,
  landingHighlights,
  landingNavItems,
  landingStats,
} from '@/lib/landing-content';
import { apiClient } from '@/lib/api-client';

const buttonPrimary =
  'inline-flex items-center justify-center gap-2.5 rounded-xl border border-[#7770f5] bg-[linear-gradient(138deg,#6662e8_0%,#4b46c8_52%,#b14fff_100%)] px-5 py-2.5 text-sm font-semibold text-white tracking-wide transition-all duration-300 hover:-translate-y-0.5 hover:border-[#9f95ff] hover:shadow-[0_14px_28px_-16px_rgba(168,85,247,0.9)]';
const buttonSecondary =
  'inline-flex items-center justify-center gap-2.5 rounded-xl border border-layout-divider bg-layout-topbar/70 px-5 py-2.5 text-sm font-semibold text-[#d7ddf2] tracking-wide transition-all duration-300 hover:border-[#5d649b] hover:bg-layout-hover hover:-translate-y-0.5';

const useInView = (threshold = 0.25) => {
  const ref = useRef<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
};

const useCountUp = ({ target, decimals = 0, start }: { target: number; decimals?: number; start: boolean }) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) {
      return;
    }

    const duration = 1200;
    const startedAt = performance.now();
    let rafId = 0;

    const animate = (timestamp: number) => {
      const progress = Math.min((timestamp - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [start, target]);

  return value.toFixed(decimals);
};

const ScrollReveal = ({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) => {
  const { ref, isInView } = useInView();

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        'transition-all duration-700 will-change-transform motion-reduce:transition-none',
        isInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const LandingNavbar = ({ authenticated, authLoading }: { authenticated: boolean; authLoading: boolean }) => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Für Admin-spezifische Sichtbarkeit des Support-Buttons
  const { user } = useAuth();
  const isAdmin = user?.id === '789555434201677824';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
        <a href={ctaLinks.home} className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-[38px] h-[38px] bg-[#4b46c8] rounded-xl shadow-astra-glow border border-[#5f5ad6]/20 overflow-hidden shrink-0 transition-transform group-hover:scale-105">
            <AstraLogo size={34} glow="soft" fill className="scale-[1.18]" alt="Astra" />
          </div>
          <div>
            <p className="text-xl font-semibold leading-none tracking-[-0.02em] text-white">Astra</p>
            <p className="text-[0.78rem] font-medium leading-none text-[#a6adca]">Discord Bot</p>
          </div>
        </a>

        <div className="hidden items-center gap-8 lg:flex">
          {landingNavItems.map((item) => (
            <a key={item.label} href={item.href} className="text-[0.96rem] font-medium text-[#bcc3df] hover:text-white transition-colors">
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {/* Support-Link in der Navbar – für alle außer Admin sichtbar */}
          {!isAdmin && (
            <a href="/support" className={buttonSecondary}>Support</a>
          )}
          <a href={ctaLinks.invite} className={buttonSecondary}>Astra einladen</a>
          {!authLoading && (
            authenticated
              ? <a href={ctaLinks.dashboard} className={buttonPrimary}>Dashboard</a>
              : <a href={ctaLinks.login} className={buttonPrimary}>Login</a>
          )}
        </div>

        <button className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-layout-divider bg-layout-topbar text-[#cfd4ec] lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Navigation öffnen">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-layout-divider bg-[#0f1220] px-4 pb-5 pt-4 lg:hidden">
          <div className="flex flex-col gap-2">
            {landingNavItems.map((item) => (
              <a key={item.label} href={item.href} onClick={() => setOpen(false)} className="rounded-xl border border-layout-divider bg-layout-topbar/70 px-4 py-2.5 text-[#d7ddf2]">
                {item.label}
              </a>
            ))}
            {/* Support-Link im Mobile-Menü – für alle außer Admin sichtbar */}
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

const HeroSection = ({ authenticated }: { authenticated: boolean }) => {
  const BadgeIcon = heroBadge.icon;

  return (
    <section id="start" className="grid grid-cols-1 gap-8 border-b border-layout-divider pb-12 pt-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(410px,0.9fr)] lg:items-center">
      <ScrollReveal className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#3e4370] bg-[#171a2d]/90 px-4 py-2 text-[0.86rem] text-[#d4daf2]">
          <BadgeIcon className="h-4 w-4 text-[#b085ff]" />
          {heroBadge.text}
        </div>
        <h1 className="text-[clamp(2.2rem,5.2vw,4.25rem)] leading-[1.04] tracking-[-0.03em] text-white">
          Mehr Kontrolle.
          <span className="mt-1 block bg-[linear-gradient(90deg,#c79cff_0%,#a855f7_52%,#7de3ff_100%)] bg-clip-text text-transparent">Mehr Möglichkeiten.<span className="ml-2 inline-block origin-[60%_75%] align-top text-white animate-[astra-wave_2.8s_ease-in-out_infinite]">👋</span></span>
        </h1>
        <p className="max-w-2xl text-[1.1rem] leading-relaxed text-[#bcc3df] sm:text-[1.24rem]">
          Verwalte deine Discord-Community mit Astra – zentral, übersichtlich und leistungsstark.
        </p>
        <div className="flex flex-wrap gap-3">
          {authenticated
            ? <a href={ctaLinks.dashboard} className={buttonPrimary}>Dashboard öffnen <ArrowRight className="h-4 w-4" /></a>
            : <a href={ctaLinks.login} className={buttonPrimary}>Mit Discord anmelden <ArrowRight className="h-4 w-4" /></a>}
          <a href={ctaLinks.invite} className={buttonSecondary}>Astra einladen</a>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm text-[#d1d7ef] sm:grid-cols-4">
          {landingHighlights.map((item) => (
            <span key={item} className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#22c55e]" />{item}</span>
          ))}
        </div>
      </ScrollReveal>

      <ScrollReveal delay={120} className="w-full">
        <AstraHeroProductDemo className="max-w-[500px]" />
      </ScrollReveal>
    </section>
  );
};

const FeatureCard = ({ icon: Icon, title, description, visual }: (typeof landingFeatures)[number]) => (
  <article className="group rounded-[1.2rem] border border-[#2c3248] bg-[linear-gradient(180deg,#141728_0%,#121524_100%)] p-5 shadow-astra transition-all duration-300 hover:-translate-y-1 hover:border-[#575fc0]">
    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#3a4163] bg-[#1f2338] text-[#ad8cff]">
      <Icon className="h-5 w-5" />
    </div>
    <h3 className="text-[1.36rem] font-semibold text-white tracking-tight">{title}</h3>
    <p className="mt-2 text-[0.97rem] leading-relaxed text-[#aab2cf]">{description}</p>
    <div className="mt-4 rounded-lg border border-[#303752] bg-[#111527] px-3 py-2.5 text-xs text-[#b9c3de]">
      <p>{visual.top}</p>
      <p className="mt-1 text-[#8ee7ff]">{visual.bottom}</p>
    </div>
  </article>
);

const FeatureSection = () => (
  <section id="features" className="space-y-5 border-b border-layout-divider py-12">
    <ScrollReveal className="flex items-end justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-3 text-[clamp(1.75rem,2.8vw,2.25rem)] font-semibold tracking-tight text-white">
          <div className="relative flex items-center justify-center w-10 h-10 bg-[#4b46c8] rounded-xl shadow-astra-glow border border-[#5f5ad6]/20 overflow-hidden shrink-0">
            <AstraLogo size={36} glow="soft" fill className="scale-[1.18]" alt="Astra Features" />
          </div>
          Alles, was du für deine Community brauchst.
        </h2>
        <p className="mt-1 text-[#adb4d0]">Von Tickets bis Levels – ein konsistentes Set an Werkzeugen für moderne Discord-Server.</p>
      </div>
      <a href={ctaLinks.insights} className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-layout-divider bg-layout-topbar/70 px-4 py-2.5 text-sm font-semibold text-[#d8ddf1] hover:border-[#5f66a0]">Dashboard-Einblick <ArrowRight className="h-4 w-4" /></a>
    </ScrollReveal>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {landingFeatures.map((feature, index) => (
        <ScrollReveal key={feature.title} delay={index * 60}>
          <FeatureCard {...feature} />
        </ScrollReveal>
      ))}
    </div>
  </section>
);

const DashboardPreview = () => (
  <section id="insights" className="grid grid-cols-1 gap-6 border-b border-layout-divider py-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] lg:items-center">
    <ScrollReveal>
      <img
        src={dashboardPreviewImage}
        alt="Astra Dashboard Vorschau"
        className="block h-auto w-full"
        loading="lazy"
        decoding="async"
      />
    </ScrollReveal>

    <ScrollReveal delay={120} className="space-y-4">
      <h2 className="flex items-center gap-2 text-[2rem] font-semibold tracking-tight text-white"><Monitor className="h-6 w-6 text-[#ad8cff]" />Das Dashboard</h2>
      <p className="text-[1.05rem] leading-relaxed text-[#b8bfd9]">Behalte die volle Kontrolle über deine Server, Module und Einstellungen – modern, übersichtlich und intuitiv.</p>
      <ul className="space-y-2.5">
        {dashboardBenefits.map((benefit) => (
          <li key={benefit} className="inline-flex items-center gap-2.5 text-[#d4daf0]"><Check className="h-4 w-4 text-[#22c55e]" />{benefit}</li>
        ))}
      </ul>
      <a href={ctaLinks.dashboard} className={buttonSecondary}>Dashboard entdecken <ArrowRight className="h-4 w-4" /></a>
    </ScrollReveal>
  </section>
);

const StatisticCard = ({ label, value, suffix, decimals = 0, display, icon: Icon }: (typeof landingStats)[number]) => {
  const { ref, isInView } = useInView(0.4);
  const counted = useCountUp({ target: value, decimals, start: isInView });

  const rendered = useMemo(() => {
    if (!isInView) {
      return display;
    }
    if (decimals > 0) {
      return `${counted.replace('.', ',')}${suffix ? ` ${suffix}` : ''}`;
    }
    const formatted = Number(counted).toLocaleString('de-DE');
    return `${formatted}${suffix ?? ''}`;
  }, [counted, decimals, display, isInView, suffix]);

  return (
    <article ref={ref as React.RefObject<HTMLElement>} className="rounded-[1rem] border border-layout-divider bg-[linear-gradient(180deg,#141728_0%,#111420_100%)] p-4 shadow-astra">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#3b4060] bg-[#1c2136] text-[#a98eff]">
          <Icon className="h-5 w-5" />
        </div>
        <p className="mt-3 text-[1.9rem] font-semibold leading-none tracking-tight text-white">{rendered}</p>
        <p className="mt-1 text-[0.95rem] text-[#aab2cd]">{label}</p>
      </article>
  );
};

const StatisticsSection = () => {
  const [liveStats, setLiveStats] = useState<{ users: number; guilds: number; commands: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        const res = await apiClient.get('/api/dashboard/stats');
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json?.stats) setLiveStats(json.stats);
      } catch { /* ignore */ }
    };
    fetchStats();
    const id = setInterval(fetchStats, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const stats = useMemo(() => {
    if (!liveStats) return landingStats;
    return landingStats.map((item) => {
      if (item.label === 'Nutzer') return { ...item, value: liveStats.users, suffix: '', decimals: 0, display: liveStats.users.toLocaleString('de-DE') };
      if (item.label === 'Server') return { ...item, value: liveStats.guilds, suffix: '', decimals: 0, display: liveStats.guilds.toLocaleString('de-DE') };
      if (item.label === 'Befehle') {
        const millions = liveStats.commands / 1_000_000;
        if (millions >= 1) return { ...item, value: parseFloat(millions.toFixed(1)), suffix: 'M+', decimals: 1, display: `${millions.toFixed(1).replace('.', ',')}M+` };
        const thousands = liveStats.commands / 1_000;
        if (thousands >= 1) return { ...item, value: parseFloat(thousands.toFixed(1)), suffix: 'K+', decimals: 1, display: `${thousands.toFixed(1).replace('.', ',')}K+` };
        return { ...item, value: liveStats.commands, suffix: '', decimals: 0, display: liveStats.commands.toLocaleString('de-DE') };
      }
      return item;
    });
  }, [liveStats]);

  return (
    <section className="grid grid-cols-1 gap-4 py-8 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((item, index) => (
        <ScrollReveal key={item.label} delay={index * 70}>
          <StatisticCard {...item} />
        </ScrollReveal>
      ))}
    </section>
  );
};

const CallToAction = ({ authenticated }: { authenticated: boolean }) => (
  <section className="rounded-[1.35rem] border border-[#6d45cf] bg-[linear-gradient(90deg,rgba(103,68,208,0.46)_0%,rgba(138,67,211,0.5)_35%,rgba(41,25,76,0.85)_100%)] p-5 shadow-[0_30px_65px_-46px_rgba(135,80,255,0.9)] sm:p-7">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-[2rem] font-semibold tracking-tight text-white">Jetzt mit Astra starten</h2>
        <p className="mt-1 text-[#d8dcf1]">Melde dich mit Discord an, verwalte deine Server und entdecke alle Funktionen von Astra.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {authenticated
          ? <a href={ctaLinks.dashboard} className={buttonPrimary}>Dashboard öffnen</a>
          : <a href={ctaLinks.login} className={buttonPrimary}>Mit Discord anmelden</a>}
        <a href={ctaLinks.invite} className={buttonSecondary}>Astra einladen</a>
      </div>
    </div>
  </section>
);

const LandingFooter = () => (
  <footer className="mt-10 border-t border-layout-divider pt-8">
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)]">
      <div>
        <a href={ctaLinks.home} className="inline-flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-10 h-10 bg-[#4b46c8] rounded-xl shadow-astra-glow border border-[#5f5ad6]/20 overflow-hidden shrink-0 transition-transform group-hover:scale-105">
            <AstraLogo size={36} glow="soft" fill className="scale-[1.18]" alt="Astra" />
          </div>
          <div>
            <p className="text-[1.8rem] font-semibold tracking-tight text-white leading-none">Astra</p>
            <p className="text-[#9ea6c3]">Discord Bot</p>
          </div>
        </a>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {footerGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#b4bbd6]">{group.title}</p>
            <ul className="space-y-2">
              {group.links.map((link) => (
                <li key={link.label}><a href={link.href} className="text-[#9fa8c8] hover:text-white transition-colors">{link.label}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
    <div className="mt-6 flex items-center gap-2.5">
      {footerSocialLinks.map(({ label, href, icon: Icon }) => (
        <a key={label} href={href} aria-label={label} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#2e3550] bg-[#13192b] text-[#c8d2ec] transition-colors hover:text-white hover:border-[#5962a0]">
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
    <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-layout-divider pt-4 text-sm text-[#8f97b6]">
      <p>© 2026 Astra. Alle Rechte vorbehalten.</p>
      <div className="flex items-center gap-4">
        <CookieSettingsTrigger className="text-[#9fa8c8] transition-colors hover:text-white" />
        <p>v3.2.0</p>
      </div>
    </div>
  </footer>
);

const LandingLoader = ({ visible }: { visible: boolean }) => (
  <div className={cn('fixed inset-0 z-[90] flex items-center justify-center bg-[#090d1a] transition-opacity duration-500', visible ? 'opacity-100' : 'pointer-events-none opacity-0')} aria-hidden={!visible}>
    <div className="w-[min(90vw,400px)] rounded-2xl border border-[#2b3552] bg-[#11182b]/92 p-6 shadow-[0_30px_60px_-40px_rgba(95,86,216,0.95)] backdrop-blur">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0 flex items-center justify-center w-14 h-14 bg-[#4b46c8] rounded-2xl shadow-astra-glow border border-[#5f5ad6]/30 overflow-hidden">
          <AstraLogo size={52} glow="soft" fill className="scale-[1.18]" alt="Astra" />
        </div>
        <div>
          <p className="text-xl font-bold tracking-tight text-white leading-tight">Astra</p>
          <p className="text-[0.82rem] font-medium text-[#9ea9cb]">Initialisiere Dashboard-Erlebnis...</p>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#1a2339]">
        <div className="h-full w-1/2 rounded-full bg-[linear-gradient(90deg,#4b46c8_0%,#a855f7_52%,#7de3ff_100%)] animate-[astra-loader-progress_1.5s_ease-in-out_infinite]" />
      </div>
    </div>
  </div>
);

export const LandingPage = () => {
  const { authenticated, loading: authLoading } = useAuth();
  const [loaderVisible, setLoaderVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoaderVisible(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070912] text-white scroll-smooth">
      <LandingLoader visible={loaderVisible} />
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(75,70,200,0.33)_0%,rgba(75,70,200,0.06)_22%,rgba(75,70,200,0)_44%)] animate-[astra-shift_22s_ease-in-out_infinite]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_26%,rgba(125,227,255,0.2)_0%,rgba(125,227,255,0)_37%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_85%,rgba(168,85,247,0.16)_0%,rgba(168,85,247,0)_40%)]" />
      </div>
      <div className="relative z-10">
        <LandingNavbar authenticated={authenticated} authLoading={authLoading} />
        <main className="mx-auto w-full max-w-[1520px] px-4 pb-8 sm:px-5 lg:px-7">
          <HeroSection authenticated={authenticated} />
          <FeatureSection />
          <DashboardPreview />
          <StatisticsSection />
          <ScrollReveal>
            <CallToAction authenticated={authenticated} />
          </ScrollReveal>
          <ScrollReveal>
            <LandingFooter />
          </ScrollReveal>
        </main>
      </div>
    </div>
  );
};
