import { ShieldCheck, Settings2, FileWarning, NotebookPen } from 'lucide-react';

// Module categories are derived from actually available functionality.
// Per project constraints, only "Moderation" is guaranteed and verified.
export type ModuleCategory = 'Moderation';

export type ModuleSubpage = {
  id: string; // stable id within the module
  name: string;
  // relative path segment under the module base (e.g., "automod")
  path: string;
  icon?: React.ComponentType<{ className?: string }>;
};

export type ModuleMeta = {
  key: string; // unique key within all modules
  name: string;
  description: string;
  category: ModuleCategory;
  // Absolute or relative path below /servers/:guildId
  buildPath: (guildId: string) => string;
  // Icon component from lucide-react
  icon: React.ComponentType<{ className?: string }>;
  // Declarative list of subpages within the module (for navigation & breadcrumbs)
  subpages?: ModuleSubpage[];
};

// Central registry of modules visible in the dashboard.
// IMPORTANT: Do not add speculative entries here; only modules
// that are present/approved in the codebase.
export const modulesRegistry: ModuleMeta[] = [
  {
    key: 'moderation',
    name: 'Moderation',
    description:
      'Richte automatische Moderation ein, verwalte Verwarnungen und protokolliere Moderationsereignisse.',
    category: 'Moderation',
    buildPath: (guildId: string) => `/servers/${guildId}/modules/moderation`,
    icon: ShieldCheck,
    subpages: [
      {
        id: 'automod',
        name: 'AutoMod',
        path: 'automod',
        icon: Settings2,
      },
      {
        id: 'warnings',
        name: 'Verwarnungen',
        path: 'warnings',
        icon: FileWarning,
      },
      {
        id: 'modlog',
        name: 'Modlog',
        path: 'modlog',
        icon: NotebookPen,
      },
    ],
  },
];

export const categories: { id: 'all' | ModuleCategory; name: string }[] = [
  { id: 'all', name: 'Alle Module' },
  // Derive unique categories from registry to avoid empty placeholders
  ...Array.from(new Set(modulesRegistry.map((m) => m.category))).map((c) => ({ id: c, name: c })),
];

export const getModuleByKey = (key: string): ModuleMeta | undefined =>
  modulesRegistry.find((m) => m.key === key);
