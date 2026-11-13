import {
  BookOpen,
  ChartSpline,
  Headset,
  Shield,
  Ticket,
  ClipboardList,
  Star,
  Trophy,
  UserPlus,
  Zap,
  Terminal,
  Users,
  ServerCog,
  Activity,
  Sparkles,
  MessageCircleQuestion,
  LucideIcon,
} from 'lucide-react';

export type LandingNavItem = {
  label: string;
  href: string;
};

export type LandingFeature = {
  icon: LucideIcon;
  title: string;
  description: string;
  visual: {
    top: string;
    bottom: string;
  };
};

export type LandingStat = {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  display: string;
  icon: LucideIcon;
};

export const landingNavItems: LandingNavItem[] = [
  { label: 'Start', href: '#start' },
  { label: 'Features', href: '#features' },
  { label: 'Dashboard-Einblick', href: '#insights' },
  { label: 'Dokumentation', href: '/docs' },
  { label: 'Support', href: '/support' },
];

export const landingHighlights = ['Modular', 'Leistungsstark', 'Deutschsprachig', 'Kostenlos'];

export const landingFeatures: LandingFeature[] = [
  {
    icon: Ticket,
    title: 'Tickets',
    description: 'Schnelles und strukturiertes Supportsystem mit priorisierten Threads.',
    visual: { top: 'Support • Neu', bottom: 'Ø Antwortzeit 3m' },
  },
  {
    icon: Shield,
    title: 'Automod',
    description: 'Schütze deine Community mit flexiblen Regeln und Live-Status.',
    visual: { top: 'Regeln aktiv: 12', bottom: 'Spam-Blocker • Online' },
  },
  {
    icon: ClipboardList,
    title: 'Modlog',
    description: 'Alle Moderationsaktionen übersichtlich protokolliert und filterbar.',
    visual: { top: 'Ban • User#2041', bottom: 'vor 2 Minuten' },
  },
  {
    icon: Star,
    title: 'Reaction Roles',
    description: 'Rollen einfach über Reaktionen vergeben – ohne manuelle Arbeit.',
    visual: { top: '🎮 Gamer • ✅', bottom: '🎵 Music • ✅' },
  },
  {
    icon: Trophy,
    title: 'Levels',
    description: 'Belohne Aktivität mit einem XP- und Level-System für Engagement.',
    visual: { top: 'Level 42', bottom: 'XP 7.840 / 8.000' },
  },
  {
    icon: UserPlus,
    title: 'Joinroles',
    description: 'Automatische Rollen bei Serverbeitritt für klare Onboarding-Flows.',
    visual: { top: '@Member + @Welcome', bottom: 'Auto-Zuweisung aktiv' },
  },
];

export const landingStats: LandingStat[] = [
  { icon: Users, label: 'Nutzer', value: 10000, suffix: '+', display: '10.000+' },
  { icon: ServerCog, label: 'Server', value: 50, suffix: '+', display: '50+' },
  { icon: Terminal, label: 'Befehle', value: 3.9, suffix: 'M+', decimals: 1, display: '3,9M+' },
  { icon: Activity, label: 'Uptime', value: 99.98, suffix: '%', decimals: 2, display: '99,98 %' },
];

export const dashboardBenefits = [
  'Alle Module an einem Ort',
  'Detaillierte Statistiken',
  'Übersichtliche Verwaltung',
  'Klare Rollen- und Rechteverwaltung',
];

export const footerGroups = [
  {
    title: 'Produkt',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Dashboard-Einblick', href: '#insights' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
    icon: ChartSpline,
  },
  {
    title: 'Ressourcen',
    links: [
      { label: 'Dokumentation', href: '/docs' },
      { label: 'Support', href: '/support' },
      { label: 'Status', href: '/status' },
    ],
    icon: BookOpen,
  },
  {
    title: 'Rechtliches',
    links: [
      { label: 'Datenschutz', href: '/support' },
      { label: 'Impressum', href: '/support' },
      { label: 'Nutzungsbedingungen', href: '/support' },
    ],
    icon: Headset,
  },
];

export const footerSocialLinks = [
  { label: 'Discord', href: '/support', icon: Headset },
  { label: 'Dokumentation', href: '/docs', icon: MessageCircleQuestion },
  { label: 'Updates', href: '/status', icon: Sparkles },
];

export const ctaLinks = {
  login: '/login',
  invite: '/support',
  dashboard: '/dashboard',
  docs: '/docs',
  support: '/support',
  status: '/status',
  home: '/',
  features: '#features',
  insights: '#insights',
};

export const heroBadge = {
  text: 'Der vielseitige Discord Bot',
  icon: Zap,
};
