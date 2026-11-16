import React from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useServerContext } from '@/contexts/ServerContext';
import { getModuleByKey } from '@/modules/registry';

type Crumb = { label: string; to?: string };

const Breadcrumbs: React.FC = () => {
  const { guildId } = useParams();
  const { selectedServer } = useServerContext();
  const location = useLocation();

  // Path example we need to support:
  // /servers/:guildId/modules/:moduleKey/:subpage?
  // We will create crumbs: Servername → Module (optional) → Subpage (optional)
  const parts = location.pathname.split('/').filter(Boolean);
  const idxServers = parts.indexOf('servers');

  const crumbs: Crumb[] = [];
  // Link back to servers list
  crumbs.push({ label: 'Server', to: '/servers' });

  if (guildId) {
    crumbs.push({ label: selectedServer?.name ?? 'Server', to: `/servers/${guildId}` });
  }

  // Detect module and subpage
  const modulesIdx = parts.indexOf('modules');
  if (modulesIdx !== -1 && guildId) {
    const moduleKey = parts[modulesIdx + 1];
    if (moduleKey) {
      const mod = getModuleByKey(moduleKey);
      if (mod) {
        crumbs.push({ label: 'Module', to: `/servers/${guildId}/modules` });
        crumbs.push({ label: mod.name, to: mod.buildPath(guildId) });
        const sub = parts[modulesIdx + 2];
        if (sub && mod.subpages) {
          const sp = mod.subpages.find((s) => s.path === sub);
          if (sp) {
            crumbs.push({ label: sp.name });
          }
        }
      }
    }
  }

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-foreground/70">
      <ol className="flex flex-wrap items-center gap-2">
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={i} className="inline-flex items-center gap-2">
              {c.to && !isLast ? (
                <Link to={c.to} className="hover:text-white transition-colors">
                  {c.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-white' : undefined}>{c.label}</span>
              )}
              {!isLast && <ChevronRight className="h-4 w-4 opacity-60" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
