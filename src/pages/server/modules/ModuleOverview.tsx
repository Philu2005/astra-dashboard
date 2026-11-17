import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { categories, modulesRegistry } from '@/modules/registry';
import ModuleSearch from '@/components/modules/ModuleSearch';
import ModuleCategoryNavigation from '@/components/modules/ModuleCategoryNavigation';
import ModuleGrid from '@/components/modules/ModuleGrid';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { StyledBadge } from '@/components/ui/StyledBadge';
import { Layers } from 'lucide-react';

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
      <SettingsPageHeader
        heading="Module"
        description="Verwalte die Funktionen dieses Servers. Module erweitern Astra um zusätzliche Fähigkeiten wie automatische Moderation, Verwarnungen und Protokollierung. Wähle ein Modul aus, um es zu konfigurieren."
        backTo={`/servers/${guildId}`}
        backLabel="Serverübersicht"
        actions={
          <StyledBadge variant="default">
            <Layers className="w-3.5 h-3.5 mr-1" />
            {modulesRegistry.length} {modulesRegistry.length === 1 ? 'Modul' : 'Module'}
          </StyledBadge>
        }
      />

      {/* Search */}
      <div className="mb-5">
        <ModuleSearch value={query} onChange={setQuery} className="max-w-md" />
      </div>

      {/* Content layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside>
          <ModuleCategoryNavigation
            categories={categories}
            active={activeCategory}
            onChange={setActiveCategory}
          />
        </aside>
        <section>
          <ModuleGrid modules={filtered} onOpen={onOpen} />
          {filtered.length > 0 && filtered.length === modulesRegistry.length && (
            <div className="mt-6 rounded-lg border border-[#2d3246] bg-[#141728]/60 p-4">
              <p className="text-[0.88rem] text-[#9ca2be]">
                <span className="font-medium text-[#dbe3ff]">Tipp:</span> Weitere Module werden in zukünftigen Updates verfügbar sein. Die vorhandenen Module können bereits vollständig konfiguriert werden.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ModuleOverview;
