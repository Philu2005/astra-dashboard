import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { ModuleMeta } from '@/modules/registry';

type Props = {
  module: ModuleMeta;
  onClick: () => void;
};

const ModuleCard: React.FC<Props> = ({ module, onClick }) => {
  const Icon = module.icon;
  return (
    <button
      onClick={onClick}
      className="group flex flex-col rounded-lg border border-layout-divider bg-card/60 p-4 text-left shadow-sm transition-all hover:-translate-y-[1px] hover:bg-card hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:#4b46c8]"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:#1d2036] text-[color:#7de3ff]">
            <Icon className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-medium text-foreground">{module.name}</h3>
        </div>
        <ChevronRight className="h-4 w-4 text-foreground/50 transition-transform group-hover:translate-x-0.5" />
      </div>
      <p className="line-clamp-3 text-sm text-foreground/70">{module.description}</p>
    </button>
  );
};

export default ModuleCard;
