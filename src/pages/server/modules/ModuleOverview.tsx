import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { categories, modulesRegistry } from '@/modules/registry';
import ModuleSearch from '@/components/modules/ModuleSearch';
import ModuleCategoryNavigation from '@/components/modules/ModuleCategoryNavigation';
import ModuleGrid from '@/components/modules/ModuleGrid';

type CategoryId = typeof categories[number]['id'];

const normalize = (v: string) => v.trim().toLowerCase();

const ModuleOverview: React.FC = () => {
  const navigate = useNavigate();
  const { guildId = '' } = useParams();
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = normalize(query);
    return modulesRegistry.filter((m) => {
      const catOk = activeCategory === 'all' || m.category === activeCategory;
      if (!catOk) return false;
      if (!q) return true;
      const hay = `${m.name} ${m.description}`.toLowerCase();
      return hay.includes(q);
    });
  }, [activeCategory, query]);

  const onOpen = (m: (typeof modulesRegistry)[number]) => {
    if (!guildId) return;
    navigate(m.buildPath(guildId));
  };

  return (
    <div className="flex h-full flex-col">
      {/* Page header */}
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Module</h1>
          <p className="mt-1 text-sm text-foreground/70">
            Verwalte die Funktionen dieses Servers. Wähle eine Kategorie oder suche nach einem Modul.
          </p>
        </div>
        <ModuleSearch value={query} onChange={setQuery} className="sm:w-[320px]" />
      </div>

      {/* Content layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-[var(--server-header-offset,0px)]">
          <ModuleCategoryNavigation
            categories={categories}
            active={activeCategory}
            onChange={setActiveCategory}
          />
        </aside>
        <section>
          <ModuleGrid modules={filtered} onOpen={onOpen} />
        </section>
      </div>
    </div>
  );
};

export default ModuleOverview;
