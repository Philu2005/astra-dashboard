import React from 'react';
import { CircleHelp } from 'lucide-react';

type Props = {
  title?: string;
  description?: string;
};

const ModuleEmptyState: React.FC<Props> = ({
  title = 'Keine Module gefunden',
  description = 'Passe deine Suche oder Kategorie an, um Module zu sehen.',
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-layout-divider p-8 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[color:#1d2036] text-[color:#7de3ff]">
        <CircleHelp className="h-5 w-5" />
      </div>
      <h3 className="mb-1 text-sm font-medium text-foreground">{title}</h3>
      <p className="max-w-md text-sm text-foreground/70">{description}</p>
    </div>
  );
};

export default ModuleEmptyState;
