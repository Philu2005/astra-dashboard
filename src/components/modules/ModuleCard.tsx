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
      className="group flex flex-col rounded-[1.1rem] border border-[#2d3246] bg-[linear-gradient(180deg,#141728_0%,#121524_100%)] p-4 sm:p-5 text-left shadow-astra transition-all duration-300 hover:-translate-y-[2px] hover:border-astra-purple/50 hover:shadow-[0_20px_40px_-20px_rgba(75,70,200,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:#4b46c8]"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d2238] text-[#7de3ff] group-hover:bg-astra-purple/18 group-hover:text-astra-cyan transition-all duration-300 shadow-[0_12px_26px_-20px_rgba(75,70,200,0.95)] border border-[#353c56]">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="text-[1rem] font-semibold text-white">{module.name}</h3>
        </div>
        <ChevronRight className="h-4 w-4 text-foreground/40 transition-transform group-hover:translate-x-1 group-hover:text-astra-cyan" />
      </div>
      <p className="line-clamp-3 text-[0.88rem] leading-relaxed text-muted-foreground">{module.description}</p>
      {module.subpages && module.subpages.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-1.5">
          {module.subpages.map((sp) => (
            <span key={sp.id} className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#1d2238] border border-[#353c56] text-[0.75rem] text-[#9ca2be]">
              {sp.name}
            </span>
          ))}
        </div>
      )}
    </button>
  );
};

export default ModuleCard;
