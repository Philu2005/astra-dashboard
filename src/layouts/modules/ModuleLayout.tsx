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
      <div className="mb-4">
        <Breadcrumbs />
      </div>

      {/* Module header */}
      <header className="mb-2 flex items-start gap-3">
        <div className="rounded-md bg-white/5 p-2">
          <Icon className="h-5 w-5 text-[#7de3ff]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">{module.name}</h1>
          <p className="mt-1 text-sm text-foreground/70">{module.description}</p>
        </div>
      </header>

      {/* Sub navigation */}
      {module.subpages && module.subpages.length > 0 && <ModuleSubNavigation module={module} />}

      {/* Content */}
      <section className="mt-4">
        <Outlet />
      </section>
    </div>
  );
};

export default ModuleLayout;
