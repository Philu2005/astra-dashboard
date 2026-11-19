import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import type { ModuleMeta } from '@/modules/registry';
import { cn } from '@/lib/utils';

type Props = {
  module: ModuleMeta;
};

const ModuleSubNavigation: React.FC<Props> = ({ module }) => {
  const { guildId } = useParams();
  const location = useLocation();
  const base = module.buildPath(guildId ?? '');

  const items = module.subpages ?? [];

  return (
    <div className="w-fit max-w-full rounded-xl border border-[#2d3246] bg-[#0f1220]/80 p-2 shadow-astra">
      <nav
        className="flex w-full gap-1.5 overflow-x-auto scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={`${module.name} Unterseiten`}
        role="tablist"
      >
        {items.map((sp) => {
          const href = `${base}/${sp.path}`.replace(/\/+$/, '');
          const currentPath = location.pathname.replace(/\/+$/, '');
          
          const active = currentPath === href || currentPath.startsWith(`${href}/`);
          
          const Icon = sp.icon;
          return (
            <Link
              key={sp.id}
              to={href}
              className={cn(
                'inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-[0.92rem] font-medium border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-astra-purple/40 shrink-0',
                active
                  ? 'bg-[linear-gradient(90deg,rgba(83,76,205,0.5)_0%,rgba(83,76,205,0.25)_100%)] text-white border-[#5f58d8]/50 shadow-[0_4px_10px_-4px_rgba(75,70,200,0.6)]'
                  : 'text-[#9ca2be] border-transparent hover:text-white hover:bg-white/5 hover:border-[#373c53]'
              )}
              aria-current={active ? 'page' : undefined}
              role="tab"
              aria-selected={active}
            >
              {Icon && <Icon className={cn('h-4 w-4', active ? 'text-[#7de3ff]' : '')} />}
              <span>{sp.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default ModuleSubNavigation;
