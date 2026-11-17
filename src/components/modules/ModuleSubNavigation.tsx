import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import type { ModuleMeta } from '@/modules/registry';
import { cn } from '@/lib/utils';

type Props = {
  module: ModuleMeta;
};

// Compact tab-like sub navigation used inside a module
const ModuleSubNavigation: React.FC<Props> = ({ module }) => {
  const { guildId } = useParams();
  const location = useLocation();
  const base = module.buildPath(guildId ?? '');

  const items = module.subpages ?? [];

  return (
    <div>
      <nav className="flex w-full gap-1.5 overflow-x-auto">
        {items.map((sp) => {
          const href = `${base}/${sp.path}`;
          const active = location.pathname.startsWith(href);
          const Icon = sp.icon;
          return (
            <Link
              key={sp.id}
              to={href}
              className={cn(
                'inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-[0.92rem] transition-colors',
                active
                  ? 'bg-white/10 text-white'
                  : 'text-foreground/80 hover:text-white hover:bg-white/5'
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span>{sp.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default ModuleSubNavigation;
