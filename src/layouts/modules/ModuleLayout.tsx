import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
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
        <Breadcrumbs />
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
      {/* Breadcrumbs */}
      <div className="mb-3">
        <Breadcrumbs />
      </div>

      {/* Moderation header (kompakt, moderne Komposition) */}
      <header className="mb-2">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white/5 p-1.5">
            <Icon className="h-5 w-5 text-[#7de3ff]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[1.1rem] font-semibold leading-tight tracking-tight text-white">
              {module.name}
            </h1>
            <p className="mt-0.5 line-clamp-2 text-[0.9rem] text-foreground/70">
              {module.description}
            </p>
          </div>
        </div>

        {/* Integrierte, tab‑artige Navigation direkt unter Titelzeile */}
        {module.subpages && module.subpages.length > 0 && (
          <div className="mt-3">
            <ModuleSubNavigation module={module} />
          </div>
        )}
      </header>

      {/* Content */}
      <section className="mt-2">
        <Outlet />
      </section>
    </div>
  );
};

export default ModuleLayout;
