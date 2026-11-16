import React from 'react';
import type { ModuleMeta } from '@/modules/registry';
import ModuleCard from './ModuleCard';
import ModuleEmptyState from './ModuleEmptyState';

type Props = {
  modules: ModuleMeta[];
  onOpen: (m: ModuleMeta) => void;
  className?: string;
};

const ModuleGrid: React.FC<Props> = ({ modules, onOpen, className }) => {
  if (!modules.length) {
    return <ModuleEmptyState />;
  }
  return (
    <div className={className}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {modules.map((m) => (
          <ModuleCard key={m.key} module={m} onClick={() => onOpen(m)} />
        ))}
      </div>
    </div>
  );
};

export default ModuleGrid;
