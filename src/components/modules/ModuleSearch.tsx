import { Search } from 'lucide-react';
import React from 'react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  };

  const ModuleSearch: React.FC<Props> = ({ value, onChange, placeholder = 'Module suchen…', className }) => {
  return (
    <div className={`relative ${className ?? ''}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/60" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-layout-divider bg-card/70 px-3 py-2 pl-9 text-sm text-foreground placeholder:text-foreground/60 outline-none ring-0 transition-colors focus:border-[color:#4b46c8] focus:bg-card hover:bg-card"
        type="text"
        spellCheck={false}
        aria-label="Module suchen"
      />
    </div>
  );
};

export default ModuleSearch;
