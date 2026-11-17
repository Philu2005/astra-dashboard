import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import ModuleSubNavigation from '@/components/modules/ModuleSubNavigation';
import { getModuleByKey } from '@/modules/registry';

type Props = {
  moduleKey: string;
};

const ModuleLayout: React.FC<Props> = ({ moduleKey }) => {
  const { guildId } = useParams();
  const module = getModuleByKey(moduleKey);

  if (!module) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight text-white">Unbekanntes Modul</h1>
        <p className="text-sm text-foreground/70">
          Das angeforderte Modul ist nicht verfügbar. Kehre zur Modulübersicht zurück.
        </p>
      </div>
    );
  }

  const Icon = module.icon;

  return (
    <div className="flex min-h-full flex-col">
      {/* Module header */}
      <header className="mb-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d2238] text-[#7de3ff] shadow-[0_12px_26px_-20px_rgba(75,70,200,0.95)] border border-[#353c56] shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[1.2rem] font-semibold leading-tight tracking-[-0.01em] text-white">
              {module.name}
            </h1>
            <p className="mt-0.5 line-clamp-2 text-[0.9rem] text-[#9ca2be]">
              {module.description}
            </p>
          </div>
        </div>

        {module.subpages && module.subpages.length > 0 && (
          <div className="mt-4">
            <ModuleSubNavigation module={module} />
          </div>
        )}
      </header>

      {/* Content */}
      <section className="mt-1">
        <Outlet />
      </section>
    </div>
  );
};

export default ModuleLayout;
