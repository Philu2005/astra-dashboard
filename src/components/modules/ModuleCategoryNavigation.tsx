import React from 'react';
import { cn } from '@/lib/utils';
import { FolderTree, ShieldCheck } from 'lucide-react';
import type { ModuleCategory } from '@/modules/registry';

type CategoryId = 'all' | ModuleCategory;

type Props = {
  categories: { id: CategoryId; name: string }[];
  active: CategoryId;
  onChange: (id: CategoryId) => void;
  className?: string;
};

const iconForCategory = (id: CategoryId) => {
  switch (id) {
    case 'all':
      return FolderTree;
    case 'Moderation':
      return ShieldCheck;
    default:
      return FolderTree;
  }
};

const ModuleCategoryNavigation: React.FC<Props> = ({ categories, active, onChange, className }) => {
  return (
    <nav className={cn('space-y-1', className)} aria-label="Modulkategorien">
      {categories.map((cat) => {
        const Icon = iconForCategory(cat.id);
        const isActive = active === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={cn(
              'group flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
              isActive
                ? 'bg-[color:#1d2036] text-white'
                : 'text-foreground/80 hover:bg-card hover:text-foreground'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className={cn('h-4 w-4', isActive ? 'text-[color:#7de3ff]' : 'text-foreground/70 group-hover:text-foreground')} />
            <span className="truncate">{cat.name}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default ModuleCategoryNavigation;
